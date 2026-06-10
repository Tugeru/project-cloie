import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetIncompleteRoleClaim } from "@/lib/actions/onboarding-actions";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";

const REDIRECT_ERROR = "NEXT_REDIRECT";

const {
  redirectMock,
  resolveAuthSessionMock,
  deleteManyUserRoleMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`${REDIRECT_ERROR}:${path}`);
  }),
  resolveAuthSessionMock: vi.fn(),
  deleteManyUserRoleMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    userRole: {
      deleteMany: deleteManyUserRoleMock,
    },
  },
}));

describe("Onboarding Actions - resetIncompleteRoleClaim", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes user roles when profile status is not complete and redirects to /portal", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
      profileGate: { status: "STUDENT_ONBOARDING_REQUIRED" },
    });

    await expect(resetIncompleteRoleClaim()).rejects.toThrow(`${REDIRECT_ERROR}:/portal`);

    expect(deleteManyUserRoleMock).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
    });
  });

  it("does not delete user roles when profile status is complete and redirects to /portal", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      userId: "user-123",
      email: "test@example.com",
      profileGate: { status: "COMPLETE" },
    });

    await expect(resetIncompleteRoleClaim()).rejects.toThrow(`${REDIRECT_ERROR}:/portal`);

    expect(deleteManyUserRoleMock).not.toHaveBeenCalled();
  });

  it("redirects to /portal when there is no authenticated session", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    await expect(resetIncompleteRoleClaim()).rejects.toThrow(`${REDIRECT_ERROR}:/portal`);

    expect(deleteManyUserRoleMock).not.toHaveBeenCalled();
  });
});
