import { ROLES, type Role } from "@/lib/constants/roles";

export type ProfileGate =
  | { status: "ROLE_SELECTION_REQUIRED" }
  | { status: "STUDENT_ONBOARDING_REQUIRED"; intent: "student" }
  | { status: "ALUMNI_ONBOARDING_REQUIRED"; intent: "alumni" }
  | { status: "INDUSTRY_PARTNER_ONBOARDING_REQUIRED"; intent: "industry-partner" }
  | { status: "COMPLETE" };

export function resolveProfileGate(input: {
  roles: Role[];
  primaryRole: Role | null;
  studentProfileId: string | null;
  alumniProfileId: string | null;
  industryPartnerProfileId: string | null;
}): ProfileGate {
  if (input.roles.length === 0) {
    return { status: "ROLE_SELECTION_REQUIRED" };
  }

  const isStudentWorkingRole = input.roles.includes(ROLES.STUDENT);
  if (isStudentWorkingRole && !input.studentProfileId) {
    return { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" };
  }

  const isAlumniWorkingRole = input.roles.includes(ROLES.ALUMNI);
  if (isAlumniWorkingRole && !input.alumniProfileId) {
    return { status: "ALUMNI_ONBOARDING_REQUIRED", intent: "alumni" };
  }

  const isIndustryPartnerWorkingRole = input.roles.includes(ROLES.INDUSTRY_PARTNER);
  if (isIndustryPartnerWorkingRole && !input.industryPartnerProfileId) {
    return { status: "INDUSTRY_PARTNER_ONBOARDING_REQUIRED", intent: "industry-partner" };
  }

  return { status: "COMPLETE" };
}
