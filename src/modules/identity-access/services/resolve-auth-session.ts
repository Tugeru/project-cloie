import type { Role } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { buildAuthSessionSnapshot } from "./build-auth-session-snapshot";

export async function resolveAuthSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      roles: { include: { role: true } },
      student_profile: true,
    },
  });

  const roles = dbUser?.roles.map(({ role }) => role.name as Role) ?? [];
  const studentProfileId = dbUser?.student_profile?.id ?? null;

  return buildAuthSessionSnapshot({
    userId: user.id,
    email: user.email ?? null,
    roles,
    studentProfileId,
  });
}
