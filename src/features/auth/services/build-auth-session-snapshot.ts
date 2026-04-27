import type { Role } from "@/lib/constants/roles";
import { resolveProfileGate } from "@/features/users/services/resolve-profile-gate";
import { resolvePrimaryRole } from "./resolve-primary-role";

export type AuthSessionSnapshot = {
  userId: string;
  email: string | null;
  roles: Role[];
  primaryRole: Role | null;
  studentProfileId: string | null;
  isGraduating: boolean;
  profileGate: ReturnType<typeof resolveProfileGate>;
};

export function buildAuthSessionSnapshot(input: {
  userId: string;
  email: string | null;
  roles: Role[];
  studentProfileId: string | null;
  isGraduating: boolean;
}): AuthSessionSnapshot {
  const primaryRole = resolvePrimaryRole(input.roles);

  return {
    userId: input.userId,
    email: input.email,
    roles: input.roles,
    primaryRole,
    studentProfileId: input.studentProfileId,
    isGraduating: input.isGraduating,
    profileGate: resolveProfileGate({
      roles: input.roles,
      primaryRole,
      studentProfileId: input.studentProfileId,
    }),
  };
}
