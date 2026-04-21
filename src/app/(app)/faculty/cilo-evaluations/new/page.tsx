import { redirect } from "next/navigation";
import { PublishCourseBoundEvaluationForm } from "@/components/faculty/publish-course-bound-evaluation-form";
import {
  listFacultyCourseContextsAction,
  publishCourseBoundEvaluationAction,
} from "@/lib/actions/course-bound-evaluation-actions";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { ensureRoleAccess } from "@/modules/identity-access/policies/ensure-role-access";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";

export default async function NewFacultyCiloEvaluationPage() {
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
      yearLevels={yearLevels}
      publishAction={publishCourseBoundEvaluationAction}
    />
  );
}
