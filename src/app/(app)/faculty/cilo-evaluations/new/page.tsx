import { redirect } from "next/navigation";
import { CourseScope } from "@prisma/client";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { PublishCourseBoundEvaluationForm } from "@/features/evaluations/components/publish-course-bound-evaluation-form";
import { getFacultyTemplatePublicationContext } from "@/features/instruments/services/manage-faculty-templates";
import {
  previewCourseBoundRespondentsAction,
  publishCourseBoundEvaluationAction,
} from "@/lib/actions/course-bound-evaluation-actions";
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

  function deriveCurrentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startYear = month >= 8 ? year : year - 1;
    return `${startYear}-${startYear + 1}`;
  }

  const resolvedAcademicYear = params.academicYear ?? deriveCurrentAcademicYear();

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

  // For GE courses, fetch all programs for multi-select targeting
  const isGeneralEducation =
    publicationContext.data.course.courseType === CourseScope.GENERAL_EDUCATION;

  const availablePrograms = isGeneralEducation
    ? await prisma.program.findMany({
        orderBy: { code: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
        },
      })
    : [];

  // Cast publicationContext to satisfy the form's PublicationContext type
  // (the form expects courseType as CourseScope, which it is at runtime)
  const formPublicationContext = {
    ...publicationContext.data,
    course: {
      ...publicationContext.data.course,
      courseType: publicationContext.data.course.courseType as CourseScope,
    },
  };

  return (
    <PublishCourseBoundEvaluationForm
      availablePrograms={availablePrograms}
      initialSelection={{
        academicYear: resolvedAcademicYear,
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
      previewAction={previewCourseBoundRespondentsAction}
      publicationContext={formPublicationContext}
      publishAction={publishCourseBoundEvaluationAction}
      yearLevels={yearLevels}
    />
  );
}
