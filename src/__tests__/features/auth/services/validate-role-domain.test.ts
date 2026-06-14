import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemRole } from "@prisma/client";
import { validateRoleDomain } from "@/features/auth/services/validate-role-domain";

describe("validateRoleDomain", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Internal Roles (STUDENT, FACULTY)", () => {
    it("should allow STUDENT with @acd.edu.ph email", () => {
      const result = validateRoleDomain("student@acd.edu.ph", SystemRole.STUDENT);
      expect(result).toEqual({ valid: true });
    });

    it("should allow STUDENT with @acdeducation.com email", () => {
      const result = validateRoleDomain("STUDENT@acdeducation.com", SystemRole.STUDENT);
      expect(result).toEqual({ valid: true });
    });

    it("should deny STUDENT with non-institutional email", () => {
      const result = validateRoleDomain("student@gmail.com", SystemRole.STUDENT);
      expect(result).toEqual({ valid: false, reason: "invalid_domain" });
    });

    it("should allow FACULTY with @acd.edu.ph email", () => {
      const result = validateRoleDomain("faculty@acd.edu.ph", SystemRole.FACULTY);
      expect(result).toEqual({ valid: true });
    });

    it("should allow FACULTY with @acdeducation.com email", () => {
      const result = validateRoleDomain("faculty@acdeducation.com", SystemRole.FACULTY);
      expect(result).toEqual({ valid: true });
    });

    it("should deny FACULTY with non-institutional email", () => {
      const result = validateRoleDomain("faculty@gmail.com", SystemRole.FACULTY);
      expect(result).toEqual({ valid: false, reason: "invalid_domain" });
    });
  });

  describe("External Roles (ALUMNI, INDUSTRY_PARTNER)", () => {
    it("should allow ALUMNI with any domain email", () => {
      const result1 = validateRoleDomain("alumni@gmail.com", SystemRole.ALUMNI);
      expect(result1).toEqual({ valid: true });

      const result2 = validateRoleDomain("alumni@acd.edu.ph", SystemRole.ALUMNI);
      expect(result2).toEqual({ valid: true });
    });

    it("should allow INDUSTRY_PARTNER with any domain email", () => {
      const result1 = validateRoleDomain("partner@company.com", SystemRole.INDUSTRY_PARTNER);
      expect(result1).toEqual({ valid: true });

      const result2 = validateRoleDomain("partner@acd.edu.ph", SystemRole.INDUSTRY_PARTNER);
      expect(result2).toEqual({ valid: true });
    });
  });

  describe("Admin and Management Roles (ADMIN, DEAN, PROGRAM_HEAD)", () => {
    it("should deny ADMIN with 'invite-only' reason", () => {
      const result = validateRoleDomain("admin@acd.edu.ph", SystemRole.ADMIN);
      expect(result).toEqual({ valid: false, reason: "invite-only" });
    });

    it("should deny DEAN with 'invite-only' reason", () => {
      const result = validateRoleDomain("dean@acd.edu.ph", SystemRole.DEAN);
      expect(result).toEqual({ valid: false, reason: "invite-only" });
    });

    it("should deny PROGRAM_HEAD with 'invite-only' reason", () => {
      const result = validateRoleDomain("ph@acd.edu.ph", SystemRole.PROGRAM_HEAD);
      expect(result).toEqual({ valid: false, reason: "invite-only" });
    });
  });

  describe("Bootstrap Admin Path", () => {
    beforeEach(() => {
      vi.stubEnv("BOOTSTRAP_ADMIN_EMAIL", "bootstrap-admin@acd.edu.ph");
    });

    it("should allow ADMIN with email matching BOOTSTRAP_ADMIN_EMAIL", () => {
      const result = validateRoleDomain("bootstrap-admin@acd.edu.ph", SystemRole.ADMIN);
      expect(result).toEqual({ valid: true });
    });

    it("should allow ADMIN with email matching BOOTSTRAP_ADMIN_EMAIL with case/whitespace variations", () => {
      const result = validateRoleDomain(" BOOTSTRAP-ADMIN@acd.edu.ph ", SystemRole.ADMIN);
      expect(result).toEqual({ valid: true });
    });

    it("should deny ADMIN with non-bootstrap email", () => {
      const result = validateRoleDomain("other-admin@acd.edu.ph", SystemRole.ADMIN);
      expect(result).toEqual({ valid: false, reason: "invite-only" });
    });

    it("should deny DEAN even with bootstrap email", () => {
      const result = validateRoleDomain("bootstrap-admin@acd.edu.ph", SystemRole.DEAN);
      expect(result).toEqual({ valid: false, reason: "invite-only" });
    });
  });
});
