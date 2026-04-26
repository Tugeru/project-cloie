import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import type {
  FacultyAnalyticsEvaluationItem,
  ListFacultyAnalyticsEvaluationsResult,
} from "../types";

export type FacultyAnalyticsFilters = {
  academicYear?: string;
  semester?: string;
  term?: string;
  courseIds?: string[];
  statuses?: string[];
  dateFrom?: Date;
  dateTo?: Date;
};

export async function listFacultyAnalyticsEvaluations(
  filters: FacultyAnalyticsFilters = {}
): Promise<ListFacultyAnalyticsEvaluationsResult> {
  const session = await resolveAuthSession();

  if (!session) {
    return { success: false, error: "Not authenticated" };
  }

  if (!session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Faculty access required" };
  }

  try {
    // Get faculty's affiliated programs
    const affiliations = await prisma.facultyProgramAffiliation.findMany({
      where: { faculty_id: session.userId },
      select: { program_id: true },
    });

    const programIds = affiliations.map((a) => a.program_id);

    // Build where clause with filters
    const where: Record<string, unknown> = {
      faculty_id: session.userId,
    };

    // Status filter - if not specified, include all except ARCHIVED by default
    if (filters.statuses && filters.statuses.length > 0) {
      where.status = { in: filters.statuses };
    }

    if (filters.academicYear) {
      where.academic_year = filters.academicYear;
    }

    if (filters.semester) {
      where.semester = filters.semester;
    }

    if (filters.term) {
      where.term = filters.term;
    }

    if (filters.courseIds && filters.courseIds.length > 0) {
      where.course_id = { in: filters.courseIds };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.published_at = {};
      if (filters.dateFrom) {
        (where.published_at as Record<string, Date>).gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        (where.published_at as Record<string, Date>).lte = filters.dateTo;
      }
    }

    const evaluations = await prisma.courseBoundEvaluation.findMany({
      where,
      orderBy: [{ published_at: "desc" }, { created_at: "desc" }],
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
        program: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          select: {
            id: true,
            response: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    });

    const items: FacultyAnalyticsEvaluationItem[] = evaluations.map((evalItem) => {
      const responseCount = evalItem.assignments.filter(
        (a) => a.response?.status === "SUBMITTED"
      ).length;

      return {
        id: evalItem.id,
        deploymentName: evalItem.deployment_name,
        courseId: evalItem.course.id,
        courseCode: evalItem.course.code,
        courseTitle: evalItem.course.title,
        programId: evalItem.program.id,
        programName: evalItem.program.name,
        academicYear: evalItem.academic_year,
        semester: evalItem.semester,
        term: evalItem.term,
        status: evalItem.status,
        publishedAt: evalItem.published_at,
        responseCount,
        totalAssignments: evalItem._count.assignments,
      };
    });

    return { success: true, evaluations: items };
  } catch (error) {
    console.error("listFacultyAnalyticsEvaluations error:", error);
    return { success: false, error: "Failed to load evaluations" };
  }
}
