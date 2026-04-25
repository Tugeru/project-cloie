import { CourseScope } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AdminCourseSummaryItem = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  courseScope: CourseScope;
  courseScopeLabel: string;
  isActive: boolean;
  programId: string | null;
  programCode: string | null;
  programName: string | null;
  majorId: string | null;
  majorName: string | null;
  ciloCount: number;
  evaluationCount: number;
};

export type AdminCoursesKPI = {
  totalCourses: number;
  activeCourses: number;
  generalEducationCourses: number;
  programSpecificCourses: number;
};

export type ProgramFilterOption = {
  id: string;
  code: string;
  name: string;
};

// ---------------------------------------------------------------------------
// Main service function
// ---------------------------------------------------------------------------

export async function listAdminCoursesSummary(): Promise<{
  courses: AdminCourseSummaryItem[];
  kpi: AdminCoursesKPI;
  programs: ProgramFilterOption[];
}> {
  const [rawCourses, rawPrograms] = await Promise.all([
    prisma.course.findMany({
      include: {
        program: { select: { id: true, code: true, name: true } },
        major: { select: { id: true, name: true } },
        _count: {
          select: {
            cilos: true,
            evaluations: true,
          },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.program.findMany({
      where: { is_active: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  // KPI accumulators
  let activeCourses = 0;
  let generalEducationCourses = 0;
  let programSpecificCourses = 0;

  const courses: AdminCourseSummaryItem[] = rawCourses.map((c) => {
    if (c.is_active) activeCourses++;
    if (c.course_scope === CourseScope.GENERAL_EDUCATION) {
      generalEducationCourses++;
    } else {
      programSpecificCourses++;
    }

    return {
      id: c.id,
      code: c.code,
      title: c.title,
      description: c.description,
      courseScope: c.course_scope,
      courseScopeLabel:
        c.course_scope === CourseScope.GENERAL_EDUCATION
          ? "General Education"
          : "Program-Specific",
      isActive: c.is_active,
      programId: c.program?.id ?? null,
      programCode: c.program?.code ?? null,
      programName: c.program?.name ?? null,
      majorId: c.major?.id ?? null,
      majorName: c.major?.name ?? null,
      ciloCount: c._count.cilos,
      evaluationCount: c._count.evaluations,
    };
  });

  return {
    courses,
    kpi: {
      totalCourses: rawCourses.length,
      activeCourses,
      generalEducationCourses,
      programSpecificCourses,
    },
    programs: rawPrograms,
  };
}
