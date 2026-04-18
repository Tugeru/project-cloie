import { cache } from "react";
import { ROLES, type Role } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { buildAuthSessionSnapshot } from "./build-auth-session-snapshot";

type AuthSessionUserRecord = {
  roles: Array<{ role: { name: string } }>;
  student_profile: { id: string } | null;
} | null;

const KNOWN_ROLES = new Set<Role>(Object.values(ROLES));

function isKnownRole(roleName: string): roleName is Role {
  return KNOWN_ROLES.has(roleName as Role);
}

export const resolveAuthSession = cache(async function resolveAuthSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const dbUser: AuthSessionUserRecord = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: { include: { role: true } },
      student_profile: true,
    },
  });

  const roles: Role[] =
    dbUser?.roles
      .map((userRole) => userRole.role.name)
      .filter((roleName): roleName is Role => isKnownRole(roleName)) ?? [];
  const studentProfileId = dbUser?.student_profile?.id ?? null;

  return buildAuthSessionSnapshot({
    userId: user.id,
    email: user.email ?? null,
    roles,
    studentProfileId,
  });
});
