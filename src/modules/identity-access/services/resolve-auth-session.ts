import type { Role } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { buildAuthSessionSnapshot } from "./build-auth-session-snapshot";

type AuthSessionUserRecord = {
  roles: Array<{ role: { name: string } }>;
  student_profile: { id: string } | null;
} | null;

export async function resolveAuthSession() {
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

  const roles: Role[] = dbUser?.roles.map((userRole) => userRole.role.name as Role) ?? [];
  const studentProfileId = dbUser?.student_profile?.id ?? null;

  return buildAuthSessionSnapshot({
    userId: user.id,
    email: user.email ?? null,
    roles,
    studentProfileId,
  });
}
