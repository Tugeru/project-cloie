import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ROLES, type Role } from "@/lib/constants/roles";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/features/auth/services/resolve-post-login-destination";

type SessionGuardProps = {
  children: ReactNode;
  allowedRoles?: Role[];
};

const STUDENT_ROUTE_ROLES: Role[] = [ROLES.STUDENT];

export async function SessionGuard({ children, allowedRoles = [] }: SessionGuardProps) {
  const session = await resolveAuthSession();

  if (!session) {
    redirect("/login");
  }

  if (session.profileGate.status !== "COMPLETE") {
    redirect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: session.profileGate.status === "STUDENT_ONBOARDING_REQUIRED" ? "student" : null,
        primaryRole: session.primaryRole,
        profileGate: session.profileGate,
      })
    );
  }

  if (allowedRoles.length > 0) {
    const redirectPath = ensureRoleAccess({
      primaryRole: session.primaryRole,
      roles: session.roles,
      allowedRoles,
    });

    if (redirectPath) {
      redirect(redirectPath);
    }

    const isStudentProtectedRoute = allowedRoles.some((role) => STUDENT_ROUTE_ROLES.includes(role));
    const hasStudentLikeRole = session.roles.some((role) => STUDENT_ROUTE_ROLES.includes(role));

    if (isStudentProtectedRoute && hasStudentLikeRole && !session.studentProfileId) {
      redirect(
        resolvePostLoginDestination({
          requestedPath: "/dashboard",
          intent: "student",
          primaryRole: ROLES.STUDENT,
          profileGate: { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" },
        })
      );
    }
  }

  return <>{children}</>;
}
