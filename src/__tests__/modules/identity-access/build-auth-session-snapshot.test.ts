import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { buildAuthSessionSnapshot } from "@/modules/identity-access/services/build-auth-session-snapshot";

describe("buildAuthSessionSnapshot", () => {
  it("marks users without roles as requiring role selection", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-1",
      email: "user@acd.edu.ph",
      roles: [],
      studentProfileId: null,
    });

    expect(session.primaryRole).toBeNull();
    expect(session.profileGate).toEqual({ status: "ROLE_SELECTION_REQUIRED" });
  });

  it("marks students without a profile as requiring onboarding", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-2",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      studentProfileId: null,
    });

    expect(session.primaryRole).toBe(ROLES.STUDENT);
    expect(session.profileGate).toEqual({
      status: "STUDENT_ONBOARDING_REQUIRED",
      intent: "student",
    });
  });

  it("marks complete students as ready for the app", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-3",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      studentProfileId: "profile-1",
    });

    expect(session.profileGate).toEqual({ status: "COMPLETE" });
  });

  it("marks graduating students without a profile as requiring onboarding", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-3b",
      email: "graduating@acd.edu.ph",
      roles: [ROLES.GRADUATING_STUDENT],
      studentProfileId: null,
    });

    expect(session.primaryRole).toBe(ROLES.GRADUATING_STUDENT);
    expect(session.profileGate).toEqual({
      status: "STUDENT_ONBOARDING_REQUIRED",
      intent: "student",
    });
  });

  it("allows faculty users without student profiles", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-4",
      email: "faculty@acd.edu.ph",
      roles: [ROLES.FACULTY],
      studentProfileId: null,
    });

    expect(session.primaryRole).toBe(ROLES.FACULTY);
    expect(session.profileGate).toEqual({ status: "COMPLETE" });
  });
});
