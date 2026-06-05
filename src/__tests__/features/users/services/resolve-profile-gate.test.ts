import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { resolveProfileGate } from "@/features/users/services/resolve-profile-gate";

describe("resolveProfileGate", () => {
  it("returns ROLE_SELECTION_REQUIRED when roles array is empty", () => {
    const result = resolveProfileGate({
      roles: [],
      primaryRole: null,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
    });
    expect(result).toEqual({ status: "ROLE_SELECTION_REQUIRED" });
  });

  it("returns STUDENT_ONBOARDING_REQUIRED if user has STUDENT role but no profile", () => {
    const result = resolveProfileGate({
      roles: [ROLES.STUDENT],
      primaryRole: ROLES.STUDENT,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
    });
    expect(result).toEqual({ status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" });
  });

  it("returns ALUMNI_ONBOARDING_REQUIRED if user has ALUMNI role but no profile", () => {
    const result = resolveProfileGate({
      roles: [ROLES.ALUMNI],
      primaryRole: ROLES.ALUMNI,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
    });
    expect(result).toEqual({ status: "ALUMNI_ONBOARDING_REQUIRED", intent: "alumni" });
  });

  it("returns INDUSTRY_PARTNER_ONBOARDING_REQUIRED if user has INDUSTRY_PARTNER role but no profile", () => {
    const result = resolveProfileGate({
      roles: [ROLES.INDUSTRY_PARTNER],
      primaryRole: ROLES.INDUSTRY_PARTNER,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
    });
    expect(result).toEqual({
      status: "INDUSTRY_PARTNER_ONBOARDING_REQUIRED",
      intent: "industry-partner",
    });
  });

  it("returns COMPLETE if all roles have their profiles", () => {
    const result1 = resolveProfileGate({
      roles: [ROLES.STUDENT],
      primaryRole: ROLES.STUDENT,
      studentProfileId: "student-prof-1",
      alumniProfileId: null,
      industryPartnerProfileId: null,
    });
    expect(result1).toEqual({ status: "COMPLETE" });

    const result2 = resolveProfileGate({
      roles: [ROLES.ALUMNI],
      primaryRole: ROLES.ALUMNI,
      studentProfileId: null,
      alumniProfileId: "alumni-prof-1",
      industryPartnerProfileId: null,
    });
    expect(result2).toEqual({ status: "COMPLETE" });

    const result3 = resolveProfileGate({
      roles: [ROLES.INDUSTRY_PARTNER],
      primaryRole: ROLES.INDUSTRY_PARTNER,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: "partner-prof-1",
    });
    expect(result3).toEqual({ status: "COMPLETE" });
  });
});
