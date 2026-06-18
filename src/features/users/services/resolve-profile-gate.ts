import { ROLES, type Role } from "@/lib/constants/roles";

export type ProfileGate =
  | { status: "ROLE_SELECTION_REQUIRED" }
  | { status: "STUDENT_ONBOARDING_REQUIRED"; intent: "student" }
  | { status: "FACULTY_ONBOARDING_REQUIRED"; intent: "faculty" }
  | { status: "ALUMNI_ONBOARDING_REQUIRED"; intent: "alumni" }
  | { status: "INDUSTRY_PARTNER_ONBOARDING_REQUIRED"; intent: "industry-partner" }
  | { status: "INACTIVE" }
  | { status: "REJECTED_EXTERNAL_ACCOUNT" }
  | { status: "DEFERRED_ENROLLMENT" }
  | { status: "COMPLETE" };

export function resolveProfileGate(input: {
  roles: Role[];
  activeRole: Role | null;
  studentProfileId: string | null;
  alumniProfileId: string | null;
  industryPartnerProfileId: string | null;
  isActive?: boolean;
  alumniVerificationStatus?: string | null;
  industryPartnerVerificationStatus?: string | null;
  hasActiveEnrollment?: boolean;
  hasFacultyAffiliation?: boolean;
}): ProfileGate {
  if (input.isActive === false) {
    return { status: "INACTIVE" };
  }

  if (!input.activeRole) {
    return { status: "ROLE_SELECTION_REQUIRED" };
  }

  const role = input.activeRole;

  if (role === ROLES.FACULTY) {
    if (!input.hasFacultyAffiliation) {
      return { status: "FACULTY_ONBOARDING_REQUIRED", intent: "faculty" };
    }
  }

  if (role === ROLES.INDUSTRY_PARTNER) {
    if (!input.industryPartnerProfileId) {
      return { status: "INDUSTRY_PARTNER_ONBOARDING_REQUIRED", intent: "industry-partner" };
    }
    if (input.industryPartnerVerificationStatus === "REJECTED") {
      return { status: "REJECTED_EXTERNAL_ACCOUNT" };
    }
  }

  if (role === ROLES.ALUMNI) {
    if (!input.alumniProfileId) {
      return { status: "ALUMNI_ONBOARDING_REQUIRED", intent: "alumni" };
    }
    if (input.alumniVerificationStatus === "REJECTED") {
      return { status: "REJECTED_EXTERNAL_ACCOUNT" };
    }
  }

  if (role === ROLES.STUDENT) {
    if (!input.studentProfileId) {
      return { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" };
    }
    if (input.hasActiveEnrollment === false) {
      return { status: "DEFERRED_ENROLLMENT" };
    }
  }

  return { status: "COMPLETE" };
}
