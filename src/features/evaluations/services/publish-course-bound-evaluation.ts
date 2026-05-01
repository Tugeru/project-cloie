import { DeploymentStatus, EvaluationTemplateType } from "@prisma/client";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { getFacultyTemplatePublicationContext } from "@/features/instruments/services/manage-faculty-templates";
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
  targetYearLevelId,
  templateId,
  term,
  yearLevelIds, // Deprecated fallback
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

  // Support new targetYearLevelId, fallback to deprecated yearLevelIds
  const effectiveYearLevelIds = targetYearLevelId
    ? [targetYearLevelId]
    : toUniqueValues(yearLevelIds ?? []);

  if (effectiveYearLevelIds.length === 0) {
    return {
      error: "A year level must be selected.",
      success: false,
    };
  }

  // Validate all year levels exist
  const yearLevelsFound = await prisma.yearLevel.findMany({
    where: { id: { in: effectiveYearLevelIds } },
    select: { id: true },
  });

  if (yearLevelsFound.length !== effectiveYearLevelIds.length) {
    return {
      error: "One or more selected year levels are invalid.",
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
        effectiveYearLevelIds.map((yearLevelId) => ({
          course_bound_evaluation_id: evaluation.id,
          program_id: programId,
          year_level_id: yearLevelId,
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
            year_level_id: {
              in: effectiveYearLevelIds,
            },
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
