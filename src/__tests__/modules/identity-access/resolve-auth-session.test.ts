import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/lib/constants/roles";

const { getUserMock, findUniqueMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

vi.mock("@/features/auth/services/dev-auth", () => ({
  readDevAuthCookie: vi.fn(async () => null),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
  })),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueMock,
    },
  },
}));

describe("resolveAuthSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns null when Supabase returns an auth error", async () => {
    const { resolveAuthSession } = await import("@/features/auth/services/resolve-auth-session");
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new Error("auth failed"),
    });

    await expect(resolveAuthSession()).resolves.toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns role-selection state when the authenticated user has no DB roles", async () => {
    const { resolveAuthSession } = await import("@/features/auth/services/resolve-auth-session");
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "user@acd.edu.ph" } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({
      roles: [],
      student_profile: null,
    });

    await expect(resolveAuthSession()).resolves.toEqual({
      userId: "user-1",
      email: "user@acd.edu.ph",
      roles: [],
      primaryRole: null,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
      profileGate: { status: "ROLE_SELECTION_REQUIRED" },
    });
  });

  it("returns onboarding-required state for an authenticated student without a profile", async () => {
    const { resolveAuthSession } = await import("@/features/auth/services/resolve-auth-session");
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-2", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({
      roles: [{ role: ROLES.STUDENT }],
      student_profile: null,
    });

    await expect(resolveAuthSession()).resolves.toEqual({
      userId: "user-2",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      primaryRole: ROLES.STUDENT,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
      profileGate: {
        status: "STUDENT_ONBOARDING_REQUIRED",
        intent: "student",
      },
    });
  });

  it("returns complete state for a student with a profile", async () => {
    const { resolveAuthSession } = await import("@/features/auth/services/resolve-auth-session");
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-3", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({
      roles: [{ role: ROLES.STUDENT }],
      student_profile: { id: "profile-1" },
    });

    await expect(resolveAuthSession()).resolves.toEqual({
      userId: "user-3",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      primaryRole: ROLES.STUDENT,
      studentProfileId: "profile-1",
      alumniProfileId: null,
      industryPartnerProfileId: null,
      profileGate: { status: "COMPLETE" },
    });
  });

  it("requires onboarding for mixed faculty and student users when the student profile is missing", async () => {
    const { resolveAuthSession } = await import("@/features/auth/services/resolve-auth-session");
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-4", email: "faculty@acd.edu.ph" } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({
      roles: [{ role: ROLES.FACULTY }, { role: ROLES.STUDENT }],
      student_profile: null,
    });

    await expect(resolveAuthSession()).resolves.toEqual({
      userId: "user-4",
      email: "faculty@acd.edu.ph",
      roles: [ROLES.FACULTY, ROLES.STUDENT],
      primaryRole: ROLES.FACULTY,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
      profileGate: {
        status: "STUDENT_ONBOARDING_REQUIRED",
        intent: "student",
      },
    });
  });

  it("filters unknown DB role names out of the session snapshot", async () => {
    const { resolveAuthSession } = await import("@/features/auth/services/resolve-auth-session");
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-5", email: "unknown@acd.edu.ph" } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({
      roles: [{ role: "STALE_ROLE" }],
      student_profile: null,
    });

    await expect(resolveAuthSession()).resolves.toEqual({
      userId: "user-5",
      email: "unknown@acd.edu.ph",
      roles: [],
      primaryRole: null,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
      profileGate: { status: "ROLE_SELECTION_REQUIRED" },
    });
  });
});
