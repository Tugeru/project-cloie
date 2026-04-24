import { redirect } from "next/navigation";
import { FacultyCiloWorkspace } from "@/features/evaluations/components/faculty-cilo-workspace";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import {
  listFacultyCourseContextsAction,
  loadFacultyManagedCilosAction,
  saveFacultyManagedCilosAction,
} from "@/lib/actions/course-bound-evaluation-actions";
import { ROLES } from "@/lib/constants/roles";

export const metadata = {
  title: "Manage CILOs - Faculty | CLOIE",
};

type SearchParams = {
  academicYear?: string;
  courseId?: string;
  courseType?: string;
  majorId?: string;
  programId?: string;
  semester?: string;
  term?: string;
};

export default async function FacultyCiloWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  const redirectPath = ensureRoleAccess({
    allowedRoles: [ROLES.FACULTY],
    primaryRole: session.primaryRole,
    roles: session.roles,
  });

  if (redirectPath) {
    redirect(redirectPath);
  }

  const params = await searchParams;
  const courseContexts = await listFacultyCourseContextsAction();

  return (
    <FacultyCiloWorkspace
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
      loadAction={loadFacultyManagedCilosAction}
      saveAction={saveFacultyManagedCilosAction}
    />
  );
}
