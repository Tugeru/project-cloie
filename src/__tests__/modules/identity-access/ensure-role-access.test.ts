import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { ensureRoleAccess } from "@/features/auth/policies/ensure-role-access";

describe("ensureRoleAccess", () => {
  it("redirects anonymous access to login", () => {
    expect(ensureRoleAccess({ primaryRole: null, roles: [], allowedRoles: [ROLES.ADMIN] })).toBe(
      "/login"
    );
  });

  it("allows a matching role", () => {
    expect(
      ensureRoleAccess({
        primaryRole: ROLES.ADMIN,
        roles: [ROLES.ADMIN],
        allowedRoles: [ROLES.ADMIN],
      })
    ).toBeNull();
  });

  it("allows a multi-role user when any role matches the allowed set", () => {
    expect(
      ensureRoleAccess({
        primaryRole: ROLES.FACULTY,
        roles: [ROLES.FACULTY, ROLES.STUDENT],
        allowedRoles: [ROLES.STUDENT],
      })
    ).toBeNull();
  });

  it("blocks a mismatched role", () => {
    expect(
      ensureRoleAccess({
        primaryRole: ROLES.STUDENT,
        roles: [ROLES.STUDENT],
        allowedRoles: [ROLES.ADMIN],
      })
    ).toBe("/unauthorized");
  });
});
