import { DeploymentStatus, EvaluationTemplateType, CourseScope } from "@prisma/client";
import { isUniqueConstraintError } from "@/lib/utils/prisma-errors";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { getFacultyTemplatePublicationContext } from "@/features/instruments/services/manage-faculty-templates";
import { listStudentsForClass } from "@/features/enrollments/services/list-students-for-class";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { canDeployCourseBoundEvaluation } from "../policies";
import type {
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationResult,
} from "../types";

function buildPublicationStatus(activationAt: Date | null | undefined): "ACTIVE" | "SCHEDULED" {
  if (activationAt && activationAt.getTime() > Date.now()) {
    return DeploymentStatus.SCHEDULED;
  }

  return DeploymentStatus.ACTIVE;
}

function toUniqueValues(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}



/**
 * Phase 9: Publish course-bound evaluation using course assignment ID.
 * Resolves class identity from assignment and creates deployment with term/course FKs.
 * Issue #43: Supports on-behalf deployment by PH/Dean/Secretary with policy-based authorization.
 */
export async function publishCourseBoundEvaluation({
  assignmentId,
  activationAt = null,
  deadlineAt = null,
  deploymentName,
  respondentIds: providedRespondentIds,
  templateId,
  deployerId,
}: PublishCourseBoundEvaluationInput): Promise<PublishCourseBoundEvaluationResult> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return { error: "Authentication required.", success: false };
  }

  if (!deploymentName.trim()) {
    return { error: "Deployment name is required.", success: false };
  }

  // Lookup the assignment (needed for policy check)
  const assignment = await prisma.courseAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      course: {
        include: {
          major: true,
        },
      },
      program: true,
    },
  });

  if (!assignment) {
    return { error: "Course assignment not found.", success: false };
  }

  // Get PH scope if user is PH
  let phProgramScope: string[] = [];
  if (authSession.roles.includes(ROLES.PROGRAM_HEAD)) {
    const headProfile = await prisma.programHead.findFirst({
      where: { user_id: authSession.userId },
      select: { program_id: true },
    });
    phProgramScope = headProfile?.program_id ? [headProfile.program_id] : [];
  }

  // Call policy for authorization
  const authCheck = canDeployCourseBoundEvaluation(
    authSession,
    {
      faculty_id: assignment.faculty_id,
      program_id: assignment.program_id,
      course_scope: assignment.course.course_scope as CourseScope,
    },
    phProgramScope
  );

  if (!authCheck.allowed) {
    return { error: (authCheck as { allowed: false; reason: string }).reason, success: false };
  }

  if (!assignment.is_active) {
    return { error: "This course assignment is inactive.", success: false };
  }

  // Determine effective template ID (force bound template for on-behalf)
  let effectiveTemplateId = templateId;
  const isOnBehalf = deployerId && deployerId !== assignment.faculty_id;

  if (isOnBehalf) {
    // Force bound template for on-behalf deployments
    const boundTemplate = await prisma.instrumentTemplate.findFirst({
      where: {
        bound_course_id: assignment.course_id,
        is_active: true,
      },
      orderBy: { created_at: "desc" },
    });

    if (!boundTemplate) {
      return {
        error: "On-behalf deployment requires a course-bound template. Please create one first.",
        success: false,
      };
    }

    effectiveTemplateId = boundTemplate.id;
  }

  const publicationContext = await getFacultyTemplatePublicationContext(effectiveTemplateId);

  if (!publicationContext.success) {
    return publicationContext;
  }

  // Verify the template's course matches the assignment's course
  if (publicationContext.data.course.id !== assignment.course_id) {
    return {
      error: "The selected template is not for this course.",
      success: false,
    };
  }

  const latestVersion = await prisma.instrumentVersion.findFirst({
    where: {
      is_active: true,
      template_id: effectiveTemplateId,
      template: {
        faculty_owner_id: authSession.userId,
        id: effectiveTemplateId,
        is_active: true,
        template_type: EvaluationTemplateType.COURSE_BOUND,
      },
    },
    orderBy: {
      version_number: "desc",
    },
    select: {
      id: true,
    },
  });

  if (!latestVersion) {
    return {
      error: "Course-bound evaluation template is unavailable.",
      success: false,
    };
  }

  const status = buildPublicationStatus(activationAt);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ciloSnapshots = publicationContext.data.cilos.map((cilo, index) => ({
        description: cilo.description,
        id: cilo.id,
        label: `CILO ${index + 1}`,
      }));

      const evaluation = await tx.courseBoundEvaluation.create({
        data: {
          // Source of truth for class identity (Issue #39)
          course_assignment_id: assignment.id,
          term_instance_id: assignment.term_instance_id,
          // On-behalf deployment tracking (Issue #43)
          deployed_by: authSession.userId,
          activation_at: activationAt,
          cilos_snapshot: ciloSnapshots,
          course_info_snapshot: {
            courseCode: assignment.course.code,
            courseScope: publicationContext.data.course.courseType,
            courseTitle: assignment.course.title,
            majorName: assignment.course.major?.name ?? null,
            programCode: assignment.program.code,
            programName: assignment.program.name,
          },
          deadline_at: deadlineAt,
          deployment_name: deploymentName.trim(),
          instrument_version_id: latestVersion.id,
          published_at: new Date(),
          status,
        },
      });

      await tx.courseBoundCiloQuestionBinding.createMany({
        data: publicationContext.data.bindings.map((binding) => ({
          cilo_description_snapshot: binding.ciloDescriptionSnapshot,
          cilo_id: binding.ciloId,
          course_bound_evaluation_id: evaluation.id,
          item_key: binding.itemKey,
          question_prompt_snapshot: binding.questionPromptSnapshot,
          section_key: binding.sectionKey,
        })),
      });

      // Create single target row for the assignment's program/year
      const targetRows = [{
        course_bound_evaluation_id: evaluation.id,
        program_id: assignment.program_id,
        year_level: assignment.year_level,
      }];

      await tx.courseBoundEvaluationTarget.createMany({
        data: targetRows,
      });

      // Determine respondent IDs
      let respondentIds: string[];

      if (providedRespondentIds && providedRespondentIds.length > 0) {
        // Use the confirmed respondent list from preview step
        respondentIds = toUniqueValues(providedRespondentIds);
      } else {
        // Query students from enrollment ledger
        const studentsResult = await listStudentsForClass({
          termInstanceId: assignment.term_instance_id,
          programId: assignment.program_id,
          yearLevel: assignment.year_level,
          section: assignment.section,
        });

        if (!studentsResult.success) {
          throw new Error(studentsResult.error);
        }

        respondentIds = studentsResult.data.map((s) => s.userId);
      }

      if (respondentIds.length > 0) {
        await tx.evaluationAssignment.createMany({
          data: respondentIds.map((respondentId) => ({
            course_bound_id: evaluation.id,
            respondent_id: respondentId,
          })),
        });
      }

      return {
        success: true,
        data: {
          assignmentCount: respondentIds.length,
          evaluationId: evaluation.id,
          status,
          targetCount: targetRows.length,
        },
      };
    });

    return result as PublishCourseBoundEvaluationResult;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: "This course assignment already has a deployed evaluation.",
        success: false,
      };
    }

    console.error("Failed to publish course-bound evaluation (V2):", error);
    return {
      error: "Failed to publish evaluation. Please try again.",
      success: false,
    };
  }
}
