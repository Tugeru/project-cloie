import type { Role } from "@/lib/constants/roles";
import { resolveProfileGate } from "@/features/users/services/resolve-profile-gate";
import { resolvePrimaryRole } from "./resolve-primary-role";

export type AuthSessionSnapshot = {
  userId: string;
  email: string | null;
  roles: Role[];
  primaryRole: Role | null;
  studentProfileId: string | null;
  alumniProfileId: string | null;
  industryPartnerProfileId: string | null;
  profileGate: ReturnType<typeof resolveProfileGate>;
};

export function buildAuthSessionSnapshot(input: {
  userId: string;
  email: string | null;
  roles: Role[];
  studentProfileId: string | null;
  alumniProfileId?: string | null;
  industryPartnerProfileId?: string | null;
  isActive?: boolean;
  alumniVerificationStatus?: string | null;
  industryPartnerVerificationStatus?: string | null;
  hasActiveEnrollment?: boolean;
  hasFacultyAffiliation?: boolean;
}): AuthSessionSnapshot {
  const primaryRole = resolvePrimaryRole(input.roles);

  return {
    userId: input.userId,
    email: input.email,
    roles: input.roles,
    primaryRole,
    studentProfileId: input.studentProfileId,
    alumniProfileId: input.alumniProfileId ?? null,
    industryPartnerProfileId: input.industryPartnerProfileId ?? null,
    profileGate: resolveProfileGate({
      roles: input.roles,
      primaryRole,
      studentProfileId: input.studentProfileId,
      alumniProfileId: input.alumniProfileId ?? null,
      industryPartnerProfileId: input.industryPartnerProfileId ?? null,
      isActive: input.isActive,
      alumniVerificationStatus: input.alumniVerificationStatus,
      industryPartnerVerificationStatus: input.industryPartnerVerificationStatus,
      hasActiveEnrollment: input.hasActiveEnrollment,
      hasFacultyAffiliation: input.hasFacultyAffiliation,
    }),
  };
}
