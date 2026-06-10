import { describe, expect, it } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { buildAuthSessionSnapshot } from "@/features/auth/services/build-auth-session-snapshot";

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

  it("marks students with a profile as complete", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-3",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      studentProfileId: "profile-1",
    });

    expect(session.primaryRole).toBe(ROLES.STUDENT);
    expect(session.profileGate).toEqual({ status: "COMPLETE" });
  });

  it("gates mixed faculty and student users based on their primary role (FACULTY)", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-4",
      email: "faculty@acd.edu.ph",
      roles: [ROLES.FACULTY, ROLES.STUDENT],
      studentProfileId: null,
    });

    expect(session.primaryRole).toBe(ROLES.FACULTY);
    expect(session.profileGate).toEqual({
      status: "FACULTY_ONBOARDING_REQUIRED",
      intent: "faculty",
    });
  });

  it("allows faculty users without student profiles", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-5",
      email: "faculty@acd.edu.ph",
      roles: [ROLES.FACULTY],
      studentProfileId: null,
      hasFacultyAffiliation: true,
    });

    expect(session.primaryRole).toBe(ROLES.FACULTY);
    expect(session.profileGate).toEqual({ status: "COMPLETE" });
  });

  it("requires faculty onboarding when hasFacultyAffiliation is false", () => {
    const session = buildAuthSessionSnapshot({
      userId: "user-6",
      email: "faculty@acd.edu.ph",
      roles: [ROLES.FACULTY],
      studentProfileId: null,
      hasFacultyAffiliation: false,
    });

    expect(session.primaryRole).toBe(ROLES.FACULTY);
    expect(session.profileGate).toEqual({
      status: "FACULTY_ONBOARDING_REQUIRED",
      intent: "faculty",
    });
  });
});
