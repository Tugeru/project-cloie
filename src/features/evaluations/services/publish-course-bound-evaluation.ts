import { DeploymentStatus, EvaluationTemplateType, YearLevel } from "@prisma/client";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { getFacultyTemplatePublicationContext } from "@/features/instruments/services/manage-faculty-templates";
import { listStudentsForClass } from "@/features/enrollments/services/list-students-for-class";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import type {
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationInputV2,
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

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}

function isCourseContextDuplicatePublishError(error: unknown) {
  if (
    !isUniqueConstraintError(error) ||
    !error ||
    typeof error !== "object" ||
    !("meta" in error)
  ) {
    return false;
  }

  const target = (error as { meta?: { target?: string[] | string } }).meta?.target;

  // Updated for new unique constraint: course_id + faculty_id + academic_year + semester + term + section
  if (typeof target === "string") {
    return target.includes("course_bound_evaluations_course_id_faculty_id_academic_year_semester_term_section_key");
  }

  if (Array.isArray(target)) {
    const targetSet = new Set(target);
    return ["course_id", "faculty_id", "academic_year", "semester", "term", "section"].every((field) =>
      targetSet.has(field)
    );
  }

  return false;
}

export async function publishCourseBoundEvaluation({
  academicYear,
  activationAt = null,
  deadlineAt = null,
  deploymentName,
  respondentIds: providedRespondentIds,
  section,
  semester,
  targetPrograms,
  targetYearLevel,
  templateId,
  term,
  yearLevels, // Deprecated fallback
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

  const publicationContext = await getFacultyTemplatePublicationContext(templateId);

  if (!publicationContext.success) {
    return publicationContext;
  }

  // Support new targetYearLevel, fallback to deprecated yearLevels
  const effectiveYearLevels: YearLevel[] = targetYearLevel
    ? [targetYearLevel]
    : (yearLevels ?? []);

  if (effectiveYearLevels.length === 0) {
    return {
      error: "A year level must be selected.",
      success: false,
    };
  }

  // Support new targetPrograms, fallback to publication context's program
  const normalizedTargetPrograms = targetPrograms && targetPrograms.length > 0
    ? toUniqueValues(targetPrograms)
    : [publicationContext.data.programId];

  if (normalizedTargetPrograms.length === 0) {
    return {
      error: "At least one target program must be selected.",
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
          academic_year: academicYear,
          activation_at: activationAt,
          cilos_snapshot: ciloSnapshots,
          course_id: publicationContext.data.course.id,
          course_info_snapshot: {
            courseCode: publicationContext.data.course.code,
            courseScope: publicationContext.data.course.courseType,
            courseTitle: publicationContext.data.course.title,
            majorName: publicationContext.data.course.majorName,
            programCode: publicationContext.data.course.programCode,
            programName: publicationContext.data.course.programName,
          },
          deadline_at: deadlineAt,
          deployment_name: deploymentName.trim(),
          faculty_id: authSession.userId,
          instrument_version_id: latestVersion.id,
          major_id: publicationContext.data.majorId,
          program_id: publicationContext.data.programId,
          section,
          published_at: new Date(),
          semester,
          status,
          term,
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

      // Create target rows: one per (program, year_level) combination
      const targetRows = normalizedTargetPrograms.flatMap((programId) =>
        effectiveYearLevels.map((yearLevel) => ({
          course_bound_evaluation_id: evaluation.id,
          program_id: programId,
          year_level: yearLevel,
        }))
      );

      await tx.courseBoundEvaluationTarget.createMany({
        data: targetRows,
      });

      // Determine respondent IDs: use provided list if available, otherwise query based on targeting
      let respondentIds: string[];

      if (providedRespondentIds && providedRespondentIds.length > 0) {
        // Use the confirmed respondent list from preview step
        respondentIds = toUniqueValues(providedRespondentIds);
      } else {
        // Query students based on targeting criteria
        const studentProfiles = await tx.studentAcademicProfile.findMany({
          where: {
            academic_year: academicYear,
            program_id: {
              in: normalizedTargetPrograms,
            },
            year_level: { in: effectiveYearLevels },
            // For major-specific courses, enforce major match
            ...(publicationContext.data.majorId ? { major_id: publicationContext.data.majorId } : {}),
            // For section-specific publications, enforce section match
            ...(section ? { section } : {}),
          },
          select: {
            user_id: true,
          },
        });

        respondentIds = toUniqueValues(studentProfiles.map((profile) => profile.user_id));
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
    if (isCourseContextDuplicatePublishError(error)) {
      return {
        error: "An evaluation is already published for this course context.",
        success: false,
      };
    }

    throw error;
  }
}

/**
 * Phase 6: Publish course-bound evaluation using course assignment ID.
 * Resolves class identity from assignment and creates deployment with term/course FKs.
 */
export async function publishCourseBoundEvaluationV2({
  assignmentId,
  activationAt = null,
  deadlineAt = null,
  deploymentName,
  respondentIds: providedRespondentIds,
  templateId,
}: PublishCourseBoundEvaluationInputV2): Promise<PublishCourseBoundEvaluationResult> {
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

      // Get academic year from term instance
      const academicYear = assignment.term_instance.school_year.code;
      const semester = assignment.term_instance.semester;
      // Summer terms have null term, so we need to provide a default
      const term = assignment.term_instance.term ?? "FIRST_TERM" as const;

      const evaluation = await tx.courseBoundEvaluation.create({
        data: {
          // Phase 6: New FKs (nullable during transition)
          term_instance_id: assignment.term_instance_id,
          course_assignment_id: assignment.id,
          
          // Legacy fields (kept for backward compatibility)
          academic_year: academicYear,
          semester,
          term,
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
