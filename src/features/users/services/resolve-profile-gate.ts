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
  primaryRole: Role | null;
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

  if (input.roles.length === 0) {
    return { status: "ROLE_SELECTION_REQUIRED" };
  }

  const isStudentWorkingRole = input.roles.includes(ROLES.STUDENT);
  if (isStudentWorkingRole) {
    if (!input.studentProfileId) {
      return { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" };
    }
    if (input.hasActiveEnrollment === false) {
      return { status: "DEFERRED_ENROLLMENT" };
    }
  }

  const isFacultyWorkingRole = input.roles.includes(ROLES.FACULTY);
  if (isFacultyWorkingRole) {
    if (!input.hasFacultyAffiliation) {
      return { status: "FACULTY_ONBOARDING_REQUIRED", intent: "faculty" };
    }
  }

  const isAlumniWorkingRole = input.roles.includes(ROLES.ALUMNI);
  if (isAlumniWorkingRole) {
    if (!input.alumniProfileId) {
      return { status: "ALUMNI_ONBOARDING_REQUIRED", intent: "alumni" };
    }
    if (input.alumniVerificationStatus === "REJECTED") {
      return { status: "REJECTED_EXTERNAL_ACCOUNT" };
    }
  }

  const isIndustryPartnerWorkingRole = input.roles.includes(ROLES.INDUSTRY_PARTNER);
  if (isIndustryPartnerWorkingRole) {
    if (!input.industryPartnerProfileId) {
      return { status: "INDUSTRY_PARTNER_ONBOARDING_REQUIRED", intent: "industry-partner" };
    }
    if (input.industryPartnerVerificationStatus === "REJECTED") {
      return { status: "REJECTED_EXTERNAL_ACCOUNT" };
    }
  }

  return { status: "COMPLETE" };
}
