import type { Role } from "@/lib/constants/roles";
import { resolveProfileGate } from "@/modules/user-lifecycle-profiles/services/resolve-profile-gate";
import { resolvePrimaryRole } from "./resolve-primary-role";

export type AuthSessionSnapshot = {
  userId: string;
  email: string | null;
  roles: Role[];
  primaryRole: Role | null;
  studentProfileId: string | null;
  profileGate: ReturnType<typeof resolveProfileGate>;
};

export function buildAuthSessionSnapshot(input: {
  userId: string;
  email: string | null;
  roles: Role[];
  studentProfileId: string | null;
}): AuthSessionSnapshot {
  return {
    userId: input.userId,
    email: input.email,
    roles: input.roles,
    primaryRole: resolvePrimaryRole(input.roles),
    studentProfileId: input.studentProfileId,
    profileGate: resolveProfileGate({
      roles: input.roles,
      studentProfileId: input.studentProfileId,
    }),
  };
}
