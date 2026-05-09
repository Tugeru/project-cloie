import { CourseScope } from "@prisma/client";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import type { FacultyCourseContext } from "../types";

/**
 * List faculty course contexts.
 * If termInstanceId is provided, returns courses assigned to faculty for that term.
 * Otherwise, falls back to program-affiliated courses (legacy behavior).
 */
export async function listFacultyCourseContexts(
  termInstanceId?: string
): Promise<FacultyCourseContext[]> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.FACULTY)) {
    return [];
  }

  let courseIds: string[] = [];

  if (termInstanceId) {
    // Get courses from assignments for this term
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        faculty_id: authSession.userId,
        term_instance_id: termInstanceId,
        is_active: true,
      },
      select: { course_id: true },
    });
    courseIds = assignments.map((a) => a.course_id);

    if (courseIds.length === 0) {
      return [];
    }
  } else {
    // Legacy: Resolve faculty's active program affiliations
    const affiliations = await prisma.facultyProgramAffiliation.findMany({
      where: {
        faculty_id: authSession.userId,
        is_active: true,
      },
      select: { program_id: true },
    });

    if (affiliations.length === 0) {
      return [];
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

  // Fetch full course details
  const courses = await prisma.course.findMany({
    where: {
      id: { in: courseIds },
      is_active: true,
    },
    include: {
      major: true,
      program: true,
    },
    orderBy: [{ course_scope: "asc" }, { code: "asc" }],
  });

  const contexts: FacultyCourseContext[] = courses.map((course) => {
    const isGeneralEducation = course.course_scope === CourseScope.GENERAL_EDUCATION;
    const isMajorSpecific =
      course.course_scope === CourseScope.MAJOR_SPECIFIC || Boolean(course.major_id);

    return {
      courseCode: course.code,
      courseId: course.id,
      courseTitle: course.title,
      courseType: isMajorSpecific ? CourseScope.MAJOR_SPECIFIC : course.course_scope,
      majorId: course.major_id,
      majorName: course.major?.name ?? null,
      programCode: course.program?.code ?? "",
      programId: course.program?.id ?? "",
      programName: course.program?.name ?? "",
      scopeLabel: isGeneralEducation
        ? `${course.program?.code ?? ""} - General Education`
        : isMajorSpecific && course.major?.name
          ? `${course.program?.code ?? ""} - ${course.major.name}`
          : `${course.program?.code ?? ""} - Shared Program Course`,
    };
  });

  return contexts;
}
