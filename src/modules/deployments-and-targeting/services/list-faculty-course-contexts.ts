import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import type { FacultyCourseContext } from "../types";

export async function listFacultyCourseContexts(): Promise<FacultyCourseContext[]> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.FACULTY)) {
    return [];
  }

  const courses = await prisma.course.findMany({
    where: {
      is_active: true,
      program: {
        is_active: true,
        faculty_program_affiliations: {
          some: {
            faculty_id: authSession.userId,
            is_active: true,
          },
        },
      },
    },
    include: {
      program: {
        select: {
          code: true,
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ program: { code: "asc" } }, { code: "asc" }],
  });

  return courses.map((course) => ({
    courseCode: course.code,
    courseId: course.id,
    courseTitle: course.title,
    programCode: course.program?.code ?? "",
    programId: course.program?.id ?? "",
    programName: course.program?.name ?? "",
  }));
}
