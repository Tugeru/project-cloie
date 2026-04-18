import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { resolvePrimaryRole } from "@/modules/identity-access/services/resolve-primary-role";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

describe("resolvePrimaryRole", () => {
  it("prefers admin over lower roles", () => {
    expect(resolvePrimaryRole([ROLES.FACULTY, ROLES.ADMIN])).toBe(ROLES.ADMIN);
  });

  it("returns null when the user has no roles", () => {
    expect(resolvePrimaryRole([])).toBeNull();
  });
});

describe("resolvePostLoginDestination", () => {
  it("sends a roleless student signup to student onboarding", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: "student",
        primaryRole: null,
        profileGate: { status: "ROLE_SELECTION_REQUIRED" },
      })
    ).toBe("/onboarding?intent=student");
  });

  it("sends an incomplete student profile back to onboarding", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.STUDENT,
        profileGate: { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" },
      })
    ).toBe("/onboarding?intent=student");
  });

  it("sends a complete student to the student dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.STUDENT,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/student/dashboard");
  });

  it("preserves an explicit non-dashboard destination", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/profile",
        intent: null,
        primaryRole: ROLES.ADMIN,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/profile");
  });
});
