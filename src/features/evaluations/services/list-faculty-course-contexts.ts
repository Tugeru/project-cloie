import { CourseScope } from "@prisma/client";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import type { FacultyCourseContext } from "../types";

export async function listFacultyCourseContexts(): Promise<FacultyCourseContext[]> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.FACULTY)) {
    return [];
  }

  const affiliations = await prisma.facultyProgramAffiliation.findMany({
    where: {
      faculty_id: authSession.userId,
      is_active: true,
      program: {
        is_active: true,
      },
    },
    include: {
      program: {
        include: {
          majors: {
            where: { is_active: true },
            orderBy: { name: "asc" },
          },
        },
      },
    },
    orderBy: { program: { code: "asc" } },
  });

  if (affiliations.length === 0) {
    return [];
  }

  const programIds = affiliations.map((affiliation) => affiliation.program_id);
  const courses = await prisma.course.findMany({
    where: {
      is_active: true,
      OR: [
        {
          program_id: {
            in: programIds,
          },
        },
        {
          course_scope: CourseScope.GENERAL_EDUCATION,
        },
      ],
    },
    include: {
      major: true,
      program: true,
    },
    orderBy: [{ course_scope: "asc" }, { code: "asc" }],
  });

  const contexts: FacultyCourseContext[] = [];

  for (const affiliation of affiliations) {
    for (const course of courses) {
      const isGeneralEducation = course.course_scope === CourseScope.GENERAL_EDUCATION;
      const isProgramMatch = course.program_id === affiliation.program_id;

      if (!isGeneralEducation && !isProgramMatch) {
        continue;
      }

      contexts.push({
        courseCode: course.code,
        courseId: course.id,
        courseTitle: course.title,
        courseType: course.course_scope,
        majorId: course.major_id,
        majorName: course.major?.name ?? null,
        programCode: affiliation.program.code,
        programId: affiliation.program.id,
        programName: affiliation.program.name,
        scopeLabel: isGeneralEducation
          ? `${affiliation.program.code} - General Education`
          : course.major?.name
            ? `${affiliation.program.code} - ${course.major.name}`
            : `${affiliation.program.code} - Shared Program Course`,
      });
    }
  }

  return contexts;
}
