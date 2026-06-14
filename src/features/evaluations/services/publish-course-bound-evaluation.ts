import { DeploymentStatus, EvaluationTemplateType } from "@prisma/client";
import { isUniqueConstraintError } from "@/lib/utils/prisma-errors";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { getFacultyTemplatePublicationContext } from "@/features/instruments/services/manage-faculty-templates";
import { listStudentsForClass } from "@/features/enrollments/services/list-students-for-class";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
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
 */
export async function publishCourseBoundEvaluation({
  assignmentId,
  activationAt = null,
  deadlineAt = null,
  deploymentName,
  respondentIds: providedRespondentIds,
  templateId,
}: PublishCourseBoundEvaluationInput): Promise<PublishCourseBoundEvaluationResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.FACULTY)) {
    return {
      error: "Faculty authentication is required.",
      success: false,
    };
  }

  if (!deploymentName.trim()) {
    return { error: "Deployment name is required.", success: false };
  }

  // Lookup the assignment and verify faculty ownership
  const assignment = await prisma.courseAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      term_instance: {
        include: {
          school_year: true,
        },
      },
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

  if (assignment.faculty_id !== authSession.userId) {
    return { error: "You do not have access to this course assignment.", success: false };
  }

  if (!assignment.is_active) {
    return { error: "This course assignment is inactive.", success: false };
  }

  const publicationContext = await getFacultyTemplatePublicationContext(templateId);

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
      template_id: templateId,
      template: {
        faculty_owner_id: authSession.userId,
        id: templateId,
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
          // Phase 9: term_instance_id is now the source of truth
          term_instance_id: assignment.term_instance_id,
          course_assignment_id: assignment.id,
          section: assignment.section,
          activation_at: activationAt,
          cilos_snapshot: ciloSnapshots,
          course_id: assignment.course_id,
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
          faculty_id: authSession.userId,
          instrument_version_id: latestVersion.id,
          major_id: assignment.course.major_id,
          program_id: assignment.program_id,
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
        assignmentCount: respondentIds.length,
        evaluationId: evaluation.id,
        status,
        success: true as const,
        targetCount: targetRows.length,
      };
    });

    return result;
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        error: `An evaluation is already published for ${assignment.course.code} - ${assignment.year_level}${assignment.section ? ` - ${assignment.section}` : ""}.`,
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
