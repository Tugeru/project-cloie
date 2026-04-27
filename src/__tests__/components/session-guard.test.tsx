import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ROLES } from "@/lib/constants/roles";

const REDIRECT_ERROR = "NEXT_REDIRECT";

const {
  redirectMock,
  resolveAuthSessionMock,
  resolvePostLoginDestinationMock,
  ensureRoleAccessMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`${REDIRECT_ERROR}:${path}`);
  }),
  resolveAuthSessionMock: vi.fn(),
  resolvePostLoginDestinationMock: vi.fn(),
  ensureRoleAccessMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

vi.mock("@/features/auth/services/resolve-post-login-destination", () => ({
  resolvePostLoginDestination: resolvePostLoginDestinationMock,
}));

vi.mock("@/features/auth/policies/ensure-role-access", () => ({
  ensureRoleAccess: ensureRoleAccessMock,
}));

import { SessionGuard } from "@/features/auth/components/session-guard";

describe("SessionGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ensureRoleAccessMock.mockReturnValue(null);
    resolvePostLoginDestinationMock.mockReturnValue("/onboarding?intent=student");
  });

  it("redirects unauthenticated users to login", async () => {
    resolveAuthSessionMock.mockResolvedValue(null);

    await expect(SessionGuard({ children: <div>Protected</div> })).rejects.toThrow(
      `${REDIRECT_ERROR}:/login`
    );
  });

  it("redirects onboarding-required users through resolvePostLoginDestination", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.STUDENT,
      profileGate: { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" },
    });

    await expect(SessionGuard({ children: <div>Protected</div> })).rejects.toThrow(
      `${REDIRECT_ERROR}:/onboarding?intent=student`
    );
    expect(resolvePostLoginDestinationMock).toHaveBeenCalledWith({
      requestedPath: "/dashboard",
      intent: "student",
      primaryRole: ROLES.STUDENT,
      profileGate: { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" },
    });
  });

  it("redirects unauthorized roles to /unauthorized", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      profileGate: { status: "COMPLETE" },
    });
    ensureRoleAccessMock.mockReturnValue("/unauthorized");

    await expect(
      SessionGuard({ children: <div>Protected</div>, allowedRoles: [ROLES.ADMIN] })
    ).rejects.toThrow(`${REDIRECT_ERROR}:/unauthorized`);
    expect(ensureRoleAccessMock).toHaveBeenCalledWith({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY],
      allowedRoles: [ROLES.ADMIN],
    });
  });

  it("passes the full session role set to authorization checks", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      roles: [ROLES.FACULTY, ROLES.STUDENT],
      primaryRole: ROLES.FACULTY,
      studentProfileId: "profile-1",
      profileGate: { status: "COMPLETE" },
    });

    await SessionGuard({ children: <div>Protected</div>, allowedRoles: [ROLES.STUDENT] });

    expect(ensureRoleAccessMock).toHaveBeenCalledWith({
      primaryRole: ROLES.FACULTY,
      roles: [ROLES.FACULTY, ROLES.STUDENT],
      allowedRoles: [ROLES.STUDENT],
    });
  });

  it("redirects mixed-role users to onboarding when their student profile is missing", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      roles: [ROLES.FACULTY, ROLES.STUDENT],
      primaryRole: ROLES.FACULTY,
      studentProfileId: null,
      profileGate: { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" },
    });

    await expect(
      SessionGuard({
        children: <div>Protected</div>,
        allowedRoles: [ROLES.FACULTY],
      })
    ).rejects.toThrow(`${REDIRECT_ERROR}:/onboarding?intent=student`);
  });

  it("renders children for an allowed complete user", async () => {
    resolveAuthSessionMock.mockResolvedValue({
      roles: [ROLES.ADMIN],
      primaryRole: ROLES.ADMIN,
      studentProfileId: null,
      profileGate: { status: "COMPLETE" },
    });

    const result = await SessionGuard({
      children: <div>Allowed Content</div>,
      allowedRoles: [ROLES.ADMIN],
    });

    render(result);
    expect(screen.getByText("Allowed Content")).toBeInTheDocument();
  });
});
