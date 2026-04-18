import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import type { Role } from "@/lib/constants/roles";
import { ensureRoleAccess } from "@/modules/identity-access/policies/ensure-role-access";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

type SessionGuardProps = {
  children: ReactNode;
  allowedRoles?: Role[];
};

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
  }

  return <>{children}</>;
}
