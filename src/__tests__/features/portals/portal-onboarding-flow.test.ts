import { describe, it, expect } from "vitest";
import { resolveProfileGate } from "@/features/users/services/resolve-profile-gate";
import { ROLES } from "@/lib/constants/roles";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("resolveProfileGate — Alumni and Industry Partner flows", () => {
  describe("ALUMNI onboarding routing", () => {
    it("requires onboarding when ALUMNI role assigned but no profile exists", () => {
      const result = resolveProfileGate({
        roles: [ROLES.ALUMNI],
        activeRole: ROLES.ALUMNI,
        studentProfileId: null,
        alumniProfileId: null,
        industryPartnerProfileId: null,
      });
      expect(result.status).toBe("ALUMNI_ONBOARDING_REQUIRED");
      if (result.status === "ALUMNI_ONBOARDING_REQUIRED") {
        expect(result.intent).toBe("alumni");
      }
    });

    it("resolves to COMPLETE when ALUMNI role + alumni profile exist (PENDING verification)", () => {
      const result = resolveProfileGate({
        roles: [ROLES.ALUMNI],
        activeRole: ROLES.ALUMNI,
        studentProfileId: null,
        alumniProfileId: UUID,
        industryPartnerProfileId: null,
      });
      expect(result.status).toBe("COMPLETE");
    });

    it("resolves to COMPLETE for existing student adding ALUMNI role (multi-role)", () => {
      const result = resolveProfileGate({
        roles: [ROLES.STUDENT, ROLES.ALUMNI],
        activeRole: ROLES.ALUMNI,
        studentProfileId: UUID,
        alumniProfileId: UUID,
        industryPartnerProfileId: null,
      });
      expect(result.status).toBe("COMPLETE");
    });
  });

  describe("INDUSTRY_PARTNER onboarding routing", () => {
    it("requires onboarding when INDUSTRY_PARTNER role assigned but no profile exists", () => {
      const result = resolveProfileGate({
        roles: [ROLES.INDUSTRY_PARTNER],
        activeRole: ROLES.INDUSTRY_PARTNER,
        studentProfileId: null,
        alumniProfileId: null,
        industryPartnerProfileId: null,
      });
      expect(result.status).toBe("INDUSTRY_PARTNER_ONBOARDING_REQUIRED");
      if (result.status === "INDUSTRY_PARTNER_ONBOARDING_REQUIRED") {
        expect(result.intent).toBe("industry-partner");
      }
    });

    it("resolves to COMPLETE when INDUSTRY_PARTNER role + profile exist (PENDING verification)", () => {
      const result = resolveProfileGate({
        roles: [ROLES.INDUSTRY_PARTNER],
        activeRole: ROLES.INDUSTRY_PARTNER,
        studentProfileId: null,
        alumniProfileId: null,
        industryPartnerProfileId: UUID,
      });
      expect(result.status).toBe("COMPLETE");
    });
  });

  describe("Onboarding intent → /portal escape hatch", () => {
    it("onboarding intent 'alumni' maps correctly to ALUMNI_ONBOARDING_REQUIRED gate", () => {
      const gate = resolveProfileGate({
        roles: [ROLES.ALUMNI],
        activeRole: ROLES.ALUMNI,
        studentProfileId: null,
        alumniProfileId: null,
        industryPartnerProfileId: null,
      });
      expect(gate.status).toBe("ALUMNI_ONBOARDING_REQUIRED");
      if (gate.status === "ALUMNI_ONBOARDING_REQUIRED") {
        // This intent drives the onboarding page to show AlumniOnboardingForm
        // Users can navigate back to /portal via the escape hatch link
        expect(gate.intent).toBe("alumni");
      }
    });

    it("onboarding intent 'industry-partner' maps correctly to INDUSTRY_PARTNER_ONBOARDING_REQUIRED gate", () => {
      const gate = resolveProfileGate({
        roles: [ROLES.INDUSTRY_PARTNER],
        activeRole: ROLES.INDUSTRY_PARTNER,
        studentProfileId: null,
        alumniProfileId: null,
        industryPartnerProfileId: null,
      });
      expect(gate.status).toBe("INDUSTRY_PARTNER_ONBOARDING_REQUIRED");
      if (gate.status === "INDUSTRY_PARTNER_ONBOARDING_REQUIRED") {
        // This intent drives the onboarding page to show IndustryPartnerOnboardingForm
        expect(gate.intent).toBe("industry-partner");
      }
    });
  });

  describe("Role selection required", () => {
    it("requires role selection when user has no roles at all", () => {
      const result = resolveProfileGate({
        roles: [],
        activeRole: null,
        studentProfileId: null,
        alumniProfileId: null,
        industryPartnerProfileId: null,
      });
      expect(result.status).toBe("ROLE_SELECTION_REQUIRED");
    });
  });

  describe("Multi-role onboarding bypass", () => {
    it("bypasses student onboarding if primary role is ALUMNI and alumni profile is present", () => {
      const result = resolveProfileGate({
        roles: [ROLES.STUDENT, ROLES.ALUMNI],
        activeRole: ROLES.ALUMNI,
        studentProfileId: null,
        alumniProfileId: UUID,
        industryPartnerProfileId: null,
      });
      expect(result.status).toBe("COMPLETE");
    });

    it("requires alumni onboarding if primary role is ALUMNI and alumni profile is missing, ignoring student profile state", () => {
      const result = resolveProfileGate({
        roles: [ROLES.STUDENT, ROLES.ALUMNI],
        activeRole: ROLES.ALUMNI,
        studentProfileId: "some-student-uuid",
        alumniProfileId: null,
        industryPartnerProfileId: null,
      });
      expect(result.status).toBe("ALUMNI_ONBOARDING_REQUIRED");
    });
  });
});
