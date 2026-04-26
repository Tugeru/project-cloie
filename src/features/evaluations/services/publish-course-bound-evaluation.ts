import { DeploymentStatus, EvaluationTemplateType } from "@prisma/client";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { getFacultyTemplatePublicationContext } from "@/features/instruments/services/manage-faculty-templates";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import type {
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationResult,
} from "../types";

function buildPublicationStatus(
  activationAt: Date | null | undefined,
): "ACTIVE" | "SCHEDULED" {
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
      (error as { code?: string }).code === "P2002",
  );
}

function isCourseContextDuplicatePublishError(error: unknown) {
  if (!isUniqueConstraintError(error) || !error || typeof error !== "object" || !("meta" in error)) {
    return false;
  }

  const target = (error as { meta?: { target?: string[] | string } }).meta?.target;

  if (typeof target === "string") {
    return target.includes("course_bound_evaluations_course_id_academic_year_semester_term_key");
  }

  if (Array.isArray(target)) {
    const targetSet = new Set(target);
    return ["course_id", "academic_year", "semester", "term"].every((field) => targetSet.has(field));
  }

  return false;
}

export async function publishCourseBoundEvaluation({
  academicYear,
  activationAt = null,
  deadlineAt = null,
  deploymentName,
  semester,
  templateId,
  term,
  yearLevelIds,
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

  const normalizedYearLevelIds = toUniqueValues(yearLevelIds);

  if (normalizedYearLevelIds.length === 0) {
    return {
      error: "At least one year level must be selected.",
      success: false,
    };
  }

  const yearLevels = await prisma.yearLevel.findMany({
    where: {
      id: {
        in: normalizedYearLevelIds,
      },
    },
    select: {
      id: true,
    },
  });

  if (yearLevels.length !== normalizedYearLevelIds.length) {
    return {
      error: "One or more selected year levels are invalid.",
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

      await tx.courseBoundEvaluationTarget.createMany({
        data: normalizedYearLevelIds.map((yearLevelId) => ({
          course_bound_evaluation_id: evaluation.id,
          program_id: publicationContext.data.programId,
          year_level_id: yearLevelId,
        })),
      });

      const studentProfiles = await tx.studentAcademicProfile.findMany({
        where: {
          academic_year: academicYear,
          ...(publicationContext.data.majorId ? { major_id: publicationContext.data.majorId } : {}),
          program_id: publicationContext.data.programId,
          year_level_id: {
            in: normalizedYearLevelIds,
          },
        },
        select: {
          user_id: true,
        },
      });

      const respondentIds = toUniqueValues(studentProfiles.map((profile) => profile.user_id));

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
        targetCount: normalizedYearLevelIds.length,
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
