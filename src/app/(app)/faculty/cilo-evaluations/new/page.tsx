import { redirect } from "next/navigation";
import { PublishCourseBoundEvaluationForm } from "@/features/evaluations/components/publish-course-bound-evaluation-form";
import {
  listFacultyCourseContextsAction,
  loadFacultyManagedCilosAction,
  publishCourseBoundEvaluationAction,
} from "@/lib/actions/course-bound-evaluation-actions";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";

type SearchParams = {
  academicYear?: string;
  courseId?: string;
  courseType?: string;
  majorId?: string;
  programId?: string;
  semester?: string;
  term?: string;
};

export default async function NewFacultyCiloEvaluationPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const redirectPath = ensureRoleAccess({
    primaryRole: session.primaryRole,
    roles: session.roles,
    allowedRoles: [ROLES.FACULTY],
  });

  if (redirectPath) {
    redirect(redirectPath);
  }

  const params = await searchParams;

  const [courseContexts, yearLevels] = await Promise.all([
    listFacultyCourseContextsAction(),
    prisma.yearLevel.findMany({
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        order: true,
      },
    }),
  ]);

  return (
    <PublishCourseBoundEvaluationForm
      courseContexts={courseContexts}
      initialSelection={{
        academicYear: params.academicYear,
        courseId: params.courseId,
        courseType:
          params.courseType === "GENERAL_EDUCATION"
            ? "GENERAL_EDUCATION"
            : params.courseType === "PROGRAM_SPECIFIC"
              ? "PROGRAM_SPECIFIC"
              : undefined,
        majorId: params.majorId ?? null,
        programId: params.programId,
        semester:
          params.semester === "SECOND" || params.semester === "SUMMER"
            ? params.semester
            : params.semester === "FIRST"
              ? "FIRST"
              : undefined,
        term:
          params.term === "SECOND_TERM"
            ? "SECOND_TERM"
            : params.term === "FIRST_TERM"
              ? "FIRST_TERM"
              : undefined,
      }}
      loadManagedCilosAction={loadFacultyManagedCilosAction}
      yearLevels={yearLevels}
      publishAction={publishCourseBoundEvaluationAction}
    />
  );
}
