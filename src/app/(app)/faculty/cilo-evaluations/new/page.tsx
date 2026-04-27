import { redirect } from "next/navigation";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { PublishCourseBoundEvaluationForm } from "@/features/evaluations/components/publish-course-bound-evaluation-form";
import { getFacultyTemplatePublicationContext } from "@/features/instruments/services/manage-faculty-templates";
import { publishCourseBoundEvaluationAction } from "@/lib/actions/course-bound-evaluation-actions";
import { ROLES } from "@/lib/constants/roles";
import { SEMESTER_OPTIONS, TERM_OPTIONS } from "@/lib/constants/academic";
import { prisma } from "@/lib/db/prisma";

type SearchParams = {
  academicYear?: string;
  semester?: string;
  templateId?: string;
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
  const yearLevels = await prisma.yearLevel.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      order: true,
    },
  });

  if (!params.templateId) {
    redirect("/faculty/tools");
  }

  const publicationContext = await getFacultyTemplatePublicationContext(params.templateId);

  if (!publicationContext.success) {
    redirect("/faculty/tools");
  }

  return (
    <PublishCourseBoundEvaluationForm
      initialSelection={{
        academicYear: params.academicYear,
        semester:
          params.semester === "SECOND" || params.semester === "SUMMER"
            ? params.semester
            : params.semester === "FIRST"
              ? "FIRST"
              : SEMESTER_OPTIONS[0].value,
        term:
          params.term === "SECOND_TERM"
            ? "SECOND_TERM"
            : params.term === "FIRST_TERM"
              ? "FIRST_TERM"
              : TERM_OPTIONS[0].value,
      }}
      publicationContext={publicationContext.data}
      publishAction={publishCourseBoundEvaluationAction}
      yearLevels={yearLevels}
    />
  );
}
