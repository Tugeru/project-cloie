import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { resolvePrimaryRole } from "@/features/auth/services/resolve-primary-role";
import { resolvePostLoginDestination } from "@/features/auth/services/resolve-post-login-destination";

describe("resolvePrimaryRole", () => {
  it("prefers admin over lower roles", () => {
    expect(resolvePrimaryRole([ROLES.FACULTY, ROLES.ADMIN])).toBe(ROLES.ADMIN);
  });

  it("uses the current deterministic role priority order", () => {
    expect(resolvePrimaryRole([ROLES.STUDENT, ROLES.ALUMNI])).toBe(ROLES.ALUMNI);
    expect(resolvePrimaryRole([ROLES.ALUMNI, ROLES.INDUSTRY_PARTNER])).toBe(ROLES.INDUSTRY_PARTNER);
    expect(resolvePrimaryRole([ROLES.INDUSTRY_PARTNER, ROLES.FACULTY])).toBe(ROLES.FACULTY);
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

  it("sends a roleless alumni signup to alumni onboarding", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: "alumni",
        primaryRole: null,
        profileGate: { status: "ROLE_SELECTION_REQUIRED" },
      })
    ).toBe("/onboarding?intent=alumni");
  });

  it("sends a roleless industry partner signup to industry partner onboarding (dash)", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: "industry-partner",
        primaryRole: null,
        profileGate: { status: "ROLE_SELECTION_REQUIRED" },
      })
    ).toBe("/onboarding?intent=industry-partner");
  });

  it("sends a roleless industry partner signup to industry partner onboarding (underscore)", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: "industry_partner",
        primaryRole: null,
        profileGate: { status: "ROLE_SELECTION_REQUIRED" },
      })
    ).toBe("/onboarding?intent=industry-partner");
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

  it("routes complete internal and external roles to their dashboards", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.STUDENT,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/student/dashboard");

    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.ALUMNI,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/alumni/dashboard");

    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.INDUSTRY_PARTNER,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/industry-partner/dashboard");
  });

  it("preserves explicit non-onboarding destinations", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/profile",
        intent: null,
        primaryRole: ROLES.ADMIN,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/profile");
  });

  it("ignores invalid requested paths", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "profile",
        intent: null,
        primaryRole: ROLES.ADMIN,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/admin/dashboard");

    expect(
      resolvePostLoginDestination({
        requestedPath: "/onboarding?intent=student",
        intent: null,
        primaryRole: ROLES.FACULTY,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/faculty/dashboard");
  });
});
