import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { CourseScope, DeploymentStatus } from "@prisma/client";
import type {
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationResult,
} from "../types";

type PublicationContext = {
  academicYear: string;
  courseId: string;
  programId: string;
  semester: PublishCourseBoundEvaluationInput["semester"];
  term: PublishCourseBoundEvaluationInput["term"];
};

function buildPublicationContext(input: PublicationContext) {
  return {
    ...input,
    ciloAcademicTerm: `${input.academicYear}|${input.semester}|${input.term}|${input.programId}`,
  };
}

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

function mapRequestedCiloWrites(cilos: PublishCourseBoundEvaluationInput["cilos"]) {
  return cilos
    .map((cilo) => cilo.description.trim())
    .filter((description) => description.length > 0)
    .map((description, index) => ({
      description,
      order: index + 1,
    }));
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
  cilos,
  courseId,
  deadlineAt = null,
  majorId = null,
  programId,
  semester,
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

  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      is_active: true,
    },
    include: {
      major: true,
      program: {
        select: {
          code: true,
          id: true,
          name: true,
        },
      },
    },
  });

  const facultyProgram = await prisma.program.findFirst({
    where: {
      id: programId,
      is_active: true,
      faculty_program_affiliations: {
        some: {
          faculty_id: authSession.userId,
          is_active: true,
        },
      },
    },
    include: {
      majors: {
        where: { is_active: true },
      },
    },
  });

  if (!course || !facultyProgram) {
    return {
      error: "Course context not found.",
      success: false,
    };
  }

  const isGeneralEducation = course.course_scope === CourseScope.GENERAL_EDUCATION;

  if (!isGeneralEducation && course.program_id !== facultyProgram.id) {
    return {
      error: "Course does not belong to the selected program context.",
      success: false,
    };
  }

  if (course.major_id && majorId && course.major_id !== majorId) {
    return {
      error: "Course does not match the selected major context.",
      success: false,
    };
  }

  if (course.major_id && !majorId) {
    return {
      error: "A matching major must be selected for this course.",
      success: false,
    };
  }

  const resolvedMajorId = majorId ?? course.major_id ?? null;

  if (resolvedMajorId) {
    const hasMajor = facultyProgram.majors.some((major) => major.id === resolvedMajorId);

    if (!hasMajor) {
      return {
        error: "Selected major does not belong to the chosen program.",
        success: false,
      };
    }
  }

  const context = buildPublicationContext({
    academicYear,
    courseId: course.id,
    programId: facultyProgram.id,
    semester,
    term,
  });
  const baselineVersion = await prisma.instrumentVersion.findFirst({
    where: {
      is_active: true,
      template: {
        code: "CILO_EVAL",
        is_active: true,
      },
    },
    include: {
      template: {
        select: {
          code: true,
          name: true,
        },
      },
    },
    orderBy: {
      version_number: "asc",
    },
  });

  if (!baselineVersion) {
    return {
      error: "Baseline CILO evaluation template is unavailable.",
      success: false,
    };
  }

  const status = buildPublicationStatus(activationAt);
  const normalizedYearLevelIds = toUniqueValues(yearLevelIds);
  const normalizedCilos = mapRequestedCiloWrites(cilos);

  if (normalizedCilos.length === 0) {
    return {
      error: "At least one CILO is required.",
      success: false,
    };
  }

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

  try {
    const result = await prisma.$transaction(async (tx) => {
      await tx.cILO.deleteMany({
        where: {
          academic_term: context.ciloAcademicTerm,
          course_id: context.courseId,
          order: {
            gt: normalizedCilos.length,
          },
        },
      });

      const ciloSnapshots = [] as Array<{ description: string; id: string; order: number }>;

      for (const requestedCilo of normalizedCilos) {
        const saved = await tx.cILO.upsert({
          where: {
            course_id_academic_term_order: {
              academic_term: context.ciloAcademicTerm,
              course_id: context.courseId,
              order: requestedCilo.order,
            },
          },
          update: {
            created_by: authSession.userId,
            description: requestedCilo.description,
          },
          create: {
            academic_term: context.ciloAcademicTerm,
            course_id: context.courseId,
            created_by: authSession.userId,
            description: requestedCilo.description,
            order: requestedCilo.order,
          },
        });

        ciloSnapshots.push({
          description: saved.description,
          id: saved.id,
          order: saved.order,
        });
      }

      const evaluation = await tx.courseBoundEvaluation.create({
        data: {
          academic_year: academicYear,
          activation_at: activationAt,
          cilos_snapshot: ciloSnapshots,
          course_id: course.id,
          course_info_snapshot: {
            courseCode: course.code,
            courseTitle: course.title,
            programCode: facultyProgram.code,
            programName: facultyProgram.name,
            courseScope: course.course_scope,
            majorName: resolvedMajorId
              ? facultyProgram.majors.find((major) => major.id === resolvedMajorId)?.name ?? null
              : null,
          },
          deadline_at: deadlineAt,
          faculty_id: authSession.userId,
          instrument_version_id: baselineVersion.id,
          major_id: resolvedMajorId,
          program_id: facultyProgram.id,
          published_at: new Date(),
          semester,
          status,
          term,
        },
      });

      await tx.courseBoundEvaluationTarget.createMany({
        data: normalizedYearLevelIds.map((yearLevelId) => ({
          course_bound_evaluation_id: evaluation.id,
          program_id: facultyProgram.id,
          year_level_id: yearLevelId,
        })),
      });

      const studentProfiles = await tx.studentAcademicProfile.findMany({
          where: {
            academic_year: academicYear,
            program_id: facultyProgram.id,
            ...(resolvedMajorId ? { major_id: resolvedMajorId } : {}),
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
        targetCount: normalizedYearLevelIds.length,
      };
    });

    return {
      ...result,
      success: true,
    };
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
