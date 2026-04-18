import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROLES } from "@/lib/constants/roles";
import { resolveAuthSession } from "@/modules/identity-access/services/resolve-auth-session";

const { getUserMock, findUniqueMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  findUniqueMock: vi.fn(),
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
  });

  it("returns null when Supabase returns an auth error", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new Error("auth failed"),
    });

    await expect(resolveAuthSession()).resolves.toBeNull();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns role-selection state when the authenticated user has no DB roles", async () => {
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
      profileGate: { status: "ROLE_SELECTION_REQUIRED" },
    });
  });

  it("returns onboarding-required state for an authenticated student without a profile", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-2", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({
      roles: [{ role: { name: ROLES.STUDENT } }],
      student_profile: null,
    });

    await expect(resolveAuthSession()).resolves.toEqual({
      userId: "user-2",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      primaryRole: ROLES.STUDENT,
      studentProfileId: null,
      profileGate: {
        status: "STUDENT_ONBOARDING_REQUIRED",
        intent: "student",
      },
    });
  });

  it("returns complete state for an authenticated student with a profile", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-3", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({
      roles: [{ role: { name: ROLES.STUDENT } }],
      student_profile: { id: "profile-1" },
    });

    await expect(resolveAuthSession()).resolves.toEqual({
      userId: "user-3",
      email: "student@acd.edu.ph",
      roles: [ROLES.STUDENT],
      primaryRole: ROLES.STUDENT,
      studentProfileId: "profile-1",
      profileGate: { status: "COMPLETE" },
    });
  });

  it("resolves the expected primary role for a multiple-role user", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-4", email: "faculty@acd.edu.ph" } },
      error: null,
    });
    findUniqueMock.mockResolvedValue({
      roles: [{ role: { name: ROLES.GRADUATING_STUDENT } }, { role: { name: ROLES.FACULTY } }],
      student_profile: { id: "profile-2" },
    });

    await expect(resolveAuthSession()).resolves.toEqual({
      userId: "user-4",
      email: "faculty@acd.edu.ph",
      roles: [ROLES.GRADUATING_STUDENT, ROLES.FACULTY],
      primaryRole: ROLES.FACULTY,
      studentProfileId: "profile-2",
      profileGate: { status: "COMPLETE" },
    });
  });
});
