import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { resolvePrimaryRole } from "@/modules/identity-access/services/resolve-primary-role";
import { resolvePostLoginDestination } from "@/modules/identity-access/services/resolve-post-login-destination";

describe("resolvePrimaryRole", () => {
  it("prefers admin over lower roles", () => {
    expect(resolvePrimaryRole([ROLES.FACULTY, ROLES.ADMIN])).toBe(ROLES.ADMIN);
  });

  it("uses the full deterministic role priority order", () => {
    expect(resolvePrimaryRole([ROLES.STUDENT, ROLES.GRADUATING_STUDENT])).toBe(
      ROLES.GRADUATING_STUDENT
    );
    expect(resolvePrimaryRole([ROLES.GRADUATING_STUDENT, ROLES.ALUMNI])).toBe(ROLES.ALUMNI);
    expect(resolvePrimaryRole([ROLES.ALUMNI, ROLES.INDUSTRY_PARTNER])).toBe(
      ROLES.INDUSTRY_PARTNER
    );
    expect(resolvePrimaryRole([ROLES.INDUSTRY_PARTNER, ROLES.FACULTY])).toBe(ROLES.FACULTY);
    expect(resolvePrimaryRole([ROLES.FACULTY, ROLES.PROGRAM_HEAD])).toBe(ROLES.PROGRAM_HEAD);
    expect(resolvePrimaryRole([ROLES.PROGRAM_HEAD, ROLES.DEAN])).toBe(ROLES.DEAN);
    expect(resolvePrimaryRole([ROLES.DEAN, ROLES.ADMIN])).toBe(ROLES.ADMIN);
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

  it("sends a roleless non-student signup to generic onboarding", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: null,
        profileGate: { status: "ROLE_SELECTION_REQUIRED" },
      })
    ).toBe("/onboarding");
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

  it("ignores a requested deep link until role selection is complete", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/profile",
        intent: null,
        primaryRole: null,
        profileGate: { status: "ROLE_SELECTION_REQUIRED" },
      })
    ).toBe("/onboarding");
  });

  it("ignores a requested deep link until student onboarding is complete", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/faculty/dashboard",
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

  it("sends a complete graduating student to the student dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.GRADUATING_STUDENT,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/student/dashboard");
  });

  it("sends a complete admin to the admin dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.ADMIN,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/admin/dashboard");
  });

  it("sends a complete dean to the dean dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.DEAN,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/dean/dashboard");
  });

  it("sends a complete program head to the program head dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.PROGRAM_HEAD,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/program-head/dashboard");
  });

  it("sends a complete faculty member to the faculty dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.FACULTY,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/faculty/dashboard");
  });

  it("fails closed for a complete alumni user instead of looping back to dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.ALUMNI,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/unauthorized");
  });

  it("fails closed for a complete industry partner instead of looping back to dashboard", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: ROLES.INDUSTRY_PARTNER,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/unauthorized");
  });

  it("falls back to the generic dashboard for a complete user with no mapped role", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "/dashboard",
        intent: null,
        primaryRole: null,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/dashboard");
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

  it("ignores requested paths without a leading slash", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "profile",
        intent: null,
        primaryRole: ROLES.ADMIN,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/admin/dashboard");
  });

  it("ignores protocol-relative requested paths", () => {
    expect(
      resolvePostLoginDestination({
        requestedPath: "//evil.example",
        intent: null,
        primaryRole: ROLES.ADMIN,
        profileGate: { status: "COMPLETE" },
      })
    ).toBe("/admin/dashboard");
  });

  it("ignores onboarding deep links for already-complete users", () => {
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
