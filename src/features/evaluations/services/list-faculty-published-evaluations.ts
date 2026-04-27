import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import type {
  FacultyPublishedEvaluationItem,
  ListFacultyPublishedEvaluationsResult,
} from "../types";

export async function listFacultyPublishedEvaluations(): Promise<ListFacultyPublishedEvaluationsResult> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Unauthorized. Faculty role required." };
  }

  // Resolve faculty's active program affiliations
  const affiliations = await prisma.facultyProgramAffiliation.findMany({
    where: {
      faculty_id: session.userId,
      is_active: true,
    },
    select: {
      program: { select: { id: true, code: true, name: true } },
    },
  });

  if (affiliations.length === 0) {
    return {
      success: false,
      error: "No active program affiliation found.",
    };
  }

  // Use first affiliation's program
  const program = affiliations[0].program;

  // Fetch all course-bound evaluations created by this faculty
  const rawEvaluations = await prisma.courseBoundEvaluation.findMany({
    where: {
      faculty_id: session.userId,
    },
    include: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          course_scope: true,
        },
      },
      program: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      major: {
        select: {
          id: true,
          name: true,
        },
      },
      targets: {
        include: {
          year_level: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          assignments: true,
        },
      },
      assignments: {
        where: {
          response: {
            status: "SUBMITTED",
          },
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      created_at: "desc",
    },
  });

  const evaluations: FacultyPublishedEvaluationItem[] = rawEvaluations.map((evalItem) => {
    const courseInfoSnapshot = evalItem.course_info_snapshot as {
      courseCode?: string;
      courseTitle?: string;
      courseScope?: string;
      majorName?: string | null;
      programCode?: string;
      programName?: string;
    } | null;

    return {
      academicYear: evalItem.academic_year,
      activationAt: evalItem.activation_at,
      courseCode: courseInfoSnapshot?.courseCode ?? evalItem.course.code,
      courseId: evalItem.course.id,
      courseScope: evalItem.course.course_scope,
      courseTitle: courseInfoSnapshot?.courseTitle ?? evalItem.course.title,
      deadlineAt: evalItem.deadline_at,
      deploymentName: evalItem.deployment_name,
      evaluationId: evalItem.id,
      majorId: evalItem.major_id,
      majorName: courseInfoSnapshot?.majorName ?? evalItem.major?.name ?? null,
      programCode: courseInfoSnapshot?.programCode ?? evalItem.program.code,
      programId: evalItem.program.id,
      programName: courseInfoSnapshot?.programName ?? evalItem.program.name,
      publishedAt: evalItem.published_at,
      responseCount: evalItem.assignments.length,
      semester: evalItem.semester,
      status: evalItem.status,
      targetYearLevels: evalItem.targets
        .map((t) => t.year_level?.name ?? null)
        .filter((name): name is string => name !== null),
      term: evalItem.term,
      totalAssignments: evalItem._count.assignments,
    };
  });

  return {
    success: true,
    evaluations,
    program,
  };
}
