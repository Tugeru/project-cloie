import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";

describe("ensureRoleAccess", () => {
  it("redirects anonymous access to portal", () => {
    expect(ensureRoleAccess({ activeRole: null, allowedRoles: [ROLES.SECRETARY] })).toBe(
      "/portal"
    );
  });

  it("allows a matching role", () => {
    expect(
      ensureRoleAccess({
        activeRole: ROLES.SECRETARY,
        allowedRoles: [ROLES.SECRETARY],
      })
    ).toBeNull();
  });

  it("blocks a mismatched role", () => {
    expect(
      ensureRoleAccess({
        activeRole: ROLES.STUDENT,
        allowedRoles: [ROLES.SECRETARY],
      })
    ).toBe("/unauthorized");
  });

  it("allows SECRETARY role to access admin routes", () => {
    expect(
      ensureRoleAccess({
        activeRole: ROLES.SECRETARY,
        allowedRoles: [ROLES.SECRETARY],
      })
    ).toBeNull();
  });
});
