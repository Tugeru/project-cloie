import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  exchangeCodeForSessionMock,
  signOutMock,
  resolveAuthSessionMock,
  resolveAuthSessionFromUserMock,
  resolvePostLoginDestinationMock,
} = vi.hoisted(() => ({
    exchangeCodeForSessionMock: vi.fn(),
    signOutMock: vi.fn(),
    resolveAuthSessionMock: vi.fn(),
    resolveAuthSessionFromUserMock: vi.fn(),
    resolvePostLoginDestinationMock: vi.fn(),
  }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      exchangeCodeForSession: exchangeCodeForSessionMock,
      signOut: signOutMock,
    },
  })),
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
  resolveAuthSessionFromUser: resolveAuthSessionFromUserMock,
}));

vi.mock("@/features/auth/services/resolve-post-login-destination", () => ({
  resolvePostLoginDestination: resolvePostLoginDestinationMock,
}));

import { GET } from "@/app/api/auth/callback/route";

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    resolvePostLoginDestinationMock.mockReturnValue("/student/dashboard");
    resolveAuthSessionMock.mockResolvedValue({
      primaryRole: "STUDENT",
      profileGate: { status: "COMPLETE" },
    });
    resolveAuthSessionFromUserMock.mockResolvedValue({
      primaryRole: "STUDENT",
      profileGate: { status: "COMPLETE" },
    });
  });

  it("redirects auth failures to the login error page", async () => {
    const response = await GET(new Request("https://cloie.test/api/auth/callback"));

    expect(response.headers.get("location")).toContain("/login?error=auth-failure");
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("signs out and redirects invalid domains to the invalid-domain login page", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { email: "user@gmail.com" } },
    });

    const response = await GET(new Request("https://cloie.test/api/auth/callback?code=abc"));

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toContain("/login?error=invalid_domain");
  });

  it("uses resolvePostLoginDestination for successful redirects", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: "user-1", email: "user@acd.edu.ph" } },
    });
    resolveAuthSessionFromUserMock.mockResolvedValue({
      primaryRole: "FACULTY",
      profileGate: { status: "COMPLETE" },
    });
    resolvePostLoginDestinationMock.mockReturnValue("/faculty/dashboard");

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&next=%2Fdashboard&intent=student")
    );

    expect(resolvePostLoginDestinationMock).toHaveBeenCalledWith({
      requestedPath: "/dashboard",
      intent: "student",
      primaryRole: "FACULTY",
      profileGate: { status: "COMPLETE" },
    });
    expect(resolveAuthSessionFromUserMock).toHaveBeenCalledWith({
      id: "user-1",
      email: "user@acd.edu.ph",
    });
    expect(resolveAuthSessionMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toContain("/faculty/dashboard");
  });

  it("ignores forwarded host overrides and keeps the trusted redirect base", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://public.example");
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: "user-2", email: "user@acd.edu.ph" } },
    });
    resolvePostLoginDestinationMock.mockReturnValue("/admin/dashboard");

    const request = new Request("https://internal.example/api/auth/callback?code=abc", {
      headers: { "x-forwarded-host": "app.example.com" },
    });
    const response = await GET(request);

    expect(response.headers.get("location")).toBe("https://public.example/admin/dashboard");
  });

  it("sanitizes malformed next values before redirecting", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: "user-3", email: "user@acd.edu.ph" } },
    });

    const response = await GET(new Request("https://cloie.test/api/auth/callback?code=abc&next=profile"));

    expect(resolvePostLoginDestinationMock).toHaveBeenCalledWith({
      requestedPath: "profile",
      intent: null,
      primaryRole: "STUDENT",
      profileGate: { status: "COMPLETE" },
    });
    expect(response.headers.get("location")).toContain("/student/dashboard");
  });
});
