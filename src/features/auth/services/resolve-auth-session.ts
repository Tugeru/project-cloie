import { cache } from "react";
import { ROLES, type Role } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { readDevAuthCookie } from "./dev-auth";
import { buildAuthSessionSnapshot } from "./build-auth-session-snapshot";

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

type AuthSessionUserRecord = {
  roles: Array<{ role: Role }>;
  student_profile: { id: string; is_graduating: boolean } | null;
} | null;

const KNOWN_ROLES = new Set<Role>(Object.values(ROLES));

function isKnownRole(roleName: string): roleName is Role {
  return KNOWN_ROLES.has(roleName as Role);
}

async function resolveAuthSessionFromAuthenticatedUser(user: AuthenticatedUser) {
  const dbUser: AuthSessionUserRecord = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: true,
      student_profile: true,
    },
  });

  const roles: Role[] =
    dbUser?.roles
      .map((userRole) => userRole.role)
      .filter((roleName): roleName is Role => isKnownRole(roleName)) ?? [];
  const studentProfileId = dbUser?.student_profile?.id ?? null;
  const isGraduating = dbUser?.student_profile?.is_graduating ?? false;

  return buildAuthSessionSnapshot({
    userId: user.id,
    email: user.email,
    roles,
    studentProfileId,
    isGraduating,
  });
}

export async function resolveAuthSessionFromUser(user: AuthenticatedUser) {
  return resolveAuthSessionFromAuthenticatedUser(user);
}

export const resolveAuthSession = cache(async function resolveAuthSession() {
  const devAuthUser = await readDevAuthCookie();

  if (devAuthUser) {
    return resolveAuthSessionFromAuthenticatedUser({
      id: devAuthUser.userId,
      email: devAuthUser.email,
    });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return resolveAuthSessionFromAuthenticatedUser({
    id: user.id,
    email: user.email ?? null,
  });
});
