import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const REDIRECT_ERROR = "NEXT_REDIRECT";

const {
  redirectMock,
  getUserMock,
  resolveAuthSessionMock,
  resolveAuthSessionFromUserMock,
  resolvePostLoginDestinationMock,
  programFindManyMock,
  yearLevelFindManyMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`${REDIRECT_ERROR}:${path}`);
  }),
  getUserMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  resolveAuthSessionFromUserMock: vi.fn(),
  resolvePostLoginDestinationMock: vi.fn(),
  programFindManyMock: vi.fn(),
  yearLevelFindManyMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
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
    program: {
      findMany: programFindManyMock,
    },
    yearLevel: {
      findMany: yearLevelFindManyMock,
    },
  },
}));

vi.mock("@/modules/identity-access/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
  resolveAuthSessionFromUser: resolveAuthSessionFromUserMock,
}));

vi.mock("@/modules/identity-access/services/resolve-post-login-destination", () => ({
  resolvePostLoginDestination: resolvePostLoginDestinationMock,
}));

vi.mock("@/app/(public)/onboarding/student-profile-form", () => ({
  StudentProfileForm: ({ email }: { email: string }) => <div>Student form for {email}</div>,
}));

import OnboardingPage from "@/app/(public)/onboarding/page";

describe("OnboardingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "user-1",
          email: "student@acd.edu.ph",
          user_metadata: { full_name: "Jamie Cruz" },
        },
      },
      error: null,
    });
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: null,
      profileGate: { status: "ROLE_SELECTION_REQUIRED" },
    });
    resolveAuthSessionFromUserMock.mockResolvedValue({
      primaryRole: null,
      profileGate: { status: "ROLE_SELECTION_REQUIRED" },
    });
    resolvePostLoginDestinationMock.mockReturnValue("/student/dashboard");
    programFindManyMock.mockResolvedValue([]);
    yearLevelFindManyMock.mockResolvedValue([]);
  });

  it("redirects unauthenticated requests to login", async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: new Error("auth failed"),
    });

    await expect(
      OnboardingPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow(`${REDIRECT_ERROR}:/login`);
  });

  it("redirects complete users through resolvePostLoginDestination", async () => {
    resolveAuthSessionFromUserMock.mockResolvedValue({
      primaryRole: "STUDENT",
      profileGate: { status: "COMPLETE" },
    });

    await expect(
      OnboardingPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow(`${REDIRECT_ERROR}:/student/dashboard`);
    expect(resolvePostLoginDestinationMock).toHaveBeenCalledWith({
      requestedPath: "/dashboard",
      intent: null,
      primaryRole: "STUDENT",
      profileGate: { status: "COMPLETE" },
    });
    expect(resolveAuthSessionFromUserMock).toHaveBeenCalledWith({
      id: "user-1",
      email: "student@acd.edu.ph",
    });
    expect(resolveAuthSessionMock).not.toHaveBeenCalled();
  });

  it("renders the student form path for incomplete users with intent=student", async () => {
    const page = await OnboardingPage({
      searchParams: Promise.resolve({ intent: "student" }),
    });

    render(page);
    expect(screen.getByText("Student form for student@acd.edu.ph")).toBeInTheDocument();
    expect(resolveAuthSessionFromUserMock).toHaveBeenCalledWith({
      id: "user-1",
      email: "student@acd.edu.ph",
    });
  });
});
