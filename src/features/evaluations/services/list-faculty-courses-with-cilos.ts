import { CourseScope } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FacultyCourseWithCiloCount = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  courseScope: CourseScope;
  courseScopeLabel: string;
  programId: string | null;
  programCode: string | null;
  programName: string | null;
  majorId: string | null;
  majorName: string | null;
  ciloCount: number;
};

export type FacultyCourseWithCilosResult =
  | {
      success: true;
      courses: FacultyCourseWithCiloCount[];
      programs: Array<{ id: string; code: string; name: string }>;
    }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * List faculty courses with CILO counts.
 * If termInstanceId is provided, returns courses assigned to faculty for that term.
 * Otherwise, falls back to program-affiliated courses (legacy behavior).
 */
export async function listFacultyCoursesWithCilos(
  termInstanceId?: string
): Promise<FacultyCourseWithCilosResult> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Faculty authentication is required." };
  }

  let courseIds: string[] = [];

  if (termInstanceId) {
    // Get courses from assignments for this term
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        faculty_id: session.userId,
        term_instance_id: termInstanceId,
        is_active: true,
      },
      select: { course_id: true },
    });
    courseIds = assignments.map((a) => a.course_id);

    if (courseIds.length === 0) {
      return { success: true, courses: [], programs: [] };
    }
  } else {
    // Legacy: Resolve faculty's active program affiliations
    const affiliations = await prisma.facultyProgramAffiliation.findMany({
      where: {
        faculty_id: session.userId,
        is_active: true,
      },
      select: { program_id: true },
    });

    if (affiliations.length === 0) {
      return { success: false, error: "No active program affiliation found." };
    }

    const programIds = affiliations.map((a) => a.program_id);

    // Fetch all course IDs in scope
    const courses = await prisma.course.findMany({
      where: {
        is_active: true,
        OR: [{ program_id: { in: programIds } }, { course_scope: CourseScope.GENERAL_EDUCATION }],
      },
      select: { id: true },
    });
    courseIds = courses.map((c) => c.id);
  }

  // Fetch full course details with CILO counts
  const rawCourses = await prisma.course.findMany({
    where: {
      id: { in: courseIds },
      is_active: true,
    },
    include: {
      program: { select: { id: true, code: true, name: true } },
      major: { select: { id: true, name: true } },
      _count: { select: { cilos: true } },
    },
    orderBy: { code: "asc" },
  });

  // Build unique programs list
  const programsMap = new Map<string, { id: string; code: string; name: string }>();
  rawCourses.forEach((c) => {
    if (c.program) {
      programsMap.set(c.program.id, c.program);
    }
  });

  const courses: FacultyCourseWithCiloCount[] = rawCourses.map((c) => {
    let scopeLabel = "Program-Specific";
    if (c.course_scope === CourseScope.GENERAL_EDUCATION) {
      scopeLabel = "General Education";
    } else if (c.course_scope === CourseScope.MAJOR_SPECIFIC || c.major_id) {
      scopeLabel = "Major-Specific";
    }

    return {
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      courseScope: c.course_scope,
      courseScopeLabel: scopeLabel,
      programId: c.program?.id ?? null,
      programCode: c.program?.code ?? null,
      programName: c.program?.name ?? null,
      majorId: c.major?.id ?? null,
      majorName: c.major?.name ?? null,
      ciloCount: c._count.cilos,
    };
  });

  return { success: true, courses, programs: Array.from(programsMap.values()) };
}
