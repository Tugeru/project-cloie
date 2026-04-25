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

export async function listFacultyCoursesWithCilos(): Promise<FacultyCourseWithCilosResult> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.FACULTY)) {
    return { success: false, error: "Faculty authentication is required." };
  }

  // Resolve faculty's active program affiliations
  const affiliations = await prisma.facultyProgramAffiliation.findMany({
    where: {
      faculty_id: session.userId,
      is_active: true,
    },
    select: {
      program: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  if (affiliations.length === 0) {
    return { success: false, error: "No active program affiliation found." };
  }

  const programs = affiliations.map((a) => a.program);
  const programIds = programs.map((p) => p.id);

  // Fetch courses: program-affiliated courses + general education courses
  const rawCourses = await prisma.course.findMany({
    where: {
      is_active: true,
      OR: [
        { program_id: { in: programIds } },
        { course_scope: CourseScope.GENERAL_EDUCATION },
      ],
    },
    include: {
      program: { select: { id: true, code: true, name: true } },
      major: { select: { id: true, name: true } },
      _count: { select: { cilos: true } },
    },
    orderBy: { code: "asc" },
  });

  const courses: FacultyCourseWithCiloCount[] = rawCourses.map((c) => {
    let scopeLabel = "Program-Specific";
    if (c.course_scope === CourseScope.GENERAL_EDUCATION) {
      scopeLabel = "General Education";
    } else if (c.major_id) {
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

  return { success: true, courses, programs };
}
