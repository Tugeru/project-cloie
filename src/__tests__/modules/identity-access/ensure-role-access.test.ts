import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { ensureRoleAccess } from "@/modules/identity-access/policies/ensure-role-access";

describe("ensureRoleAccess", () => {
  it("redirects anonymous access to login", () => {
    expect(ensureRoleAccess({ primaryRole: null, allowedRoles: [ROLES.ADMIN] })).toBe("/login");
  });

  it("allows a matching role", () => {
    expect(ensureRoleAccess({ primaryRole: ROLES.ADMIN, allowedRoles: [ROLES.ADMIN] })).toBeNull();
  });

  it("blocks a mismatched role", () => {
    expect(ensureRoleAccess({ primaryRole: ROLES.STUDENT, allowedRoles: [ROLES.ADMIN] })).toBe(
      "/unauthorized"
    );
  });

  it("allows student-like dashboards to accept graduating students", () => {
    expect(
      ensureRoleAccess({
        primaryRole: ROLES.GRADUATING_STUDENT,
        allowedRoles: [ROLES.STUDENT, ROLES.GRADUATING_STUDENT],
      })
    ).toBeNull();
  });
});
