import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemRole } from "@prisma/client";

const {
  exchangeCodeForSessionMock,
  signOutMock,
  resolveAuthSessionMock,
  resolveAuthSessionFromUserMock,
  resolvePostLoginDestinationMock,
  findUniqueUserMock,
  updateUserMock,
  createUserMock,
  createUserRoleMock,
} = vi.hoisted(() => ({
  exchangeCodeForSessionMock: vi.fn(),
  signOutMock: vi.fn(),
  resolveAuthSessionMock: vi.fn(),
  resolveAuthSessionFromUserMock: vi.fn(),
  resolvePostLoginDestinationMock: vi.fn(),
  findUniqueUserMock: vi.fn(),
  updateUserMock: vi.fn(),
  createUserMock: vi.fn(),
  createUserRoleMock: vi.fn(),
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

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: findUniqueUserMock,
      update: updateUserMock,
      create: createUserMock,
    },
    userRole: {
      create: createUserRoleMock,
    },
  },
}));

import { GET } from "@/app/api/auth/callback/route";

const VALID_UUID_1 = "00000000-0000-0000-0000-000000000001";
const VALID_UUID_2 = "00000000-0000-0000-0000-000000000002";

describe("auth callback route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://cloie.test");
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

  it("signs out and redirects invalid domains to the invalid-domain login page when intent is passed", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@gmail.com" } },
    });
    findUniqueUserMock.mockResolvedValue(null); // not found

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&intent=student")
    );

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toContain("/login?error=invalid_domain");
  });

  it("redirects new users with no intent to the role selection portal", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@gmail.com" } },
    });
    findUniqueUserMock.mockResolvedValue(null);

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc")
    );

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toBe("https://cloie.test/portal");
  });

  it("redirects existing users with no intent to their stored role dashboard", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@acd.edu.ph" } },
    });
    findUniqueUserMock.mockResolvedValue({
      id: "domain-user-1",
      auth_user_id: VALID_UUID_1,
      email: "user@acd.edu.ph",
      roles: [{ role: SystemRole.FACULTY }],
    });
    resolveAuthSessionFromUserMock.mockResolvedValue({
      primaryRole: "FACULTY",
      profileGate: { status: "COMPLETE" },
    });
    resolvePostLoginDestinationMock.mockReturnValue("/faculty/dashboard");

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc")
    );

    expect(response.headers.get("location")).toBe("https://cloie.test/faculty/dashboard");
  });

  it("links an existing unlinked admin-created user by normalized email and does not overwrite name", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: {
        user: {
          id: VALID_UUID_1,
          email: "Unlinked@ACD.edu.ph ",
          user_metadata: { given_name: "GoogleFirst", family_name: "GoogleLast" },
        },
      },
    });
    // First lookup by auth_user_id finds nothing
    findUniqueUserMock.mockResolvedValueOnce(null);
    // Second lookup by email finds unlinked user
    findUniqueUserMock.mockResolvedValueOnce({
      id: "domain-user-1",
      email: "unlinked@acd.edu.ph",
      first_name: "AdminFirst",
      last_name: "AdminLast",
      roles: [{ role: SystemRole.FACULTY }],
    });
    // Mock the update action
    updateUserMock.mockResolvedValue({
      id: "domain-user-1",
      email: "unlinked@acd.edu.ph",
      auth_user_id: VALID_UUID_1,
      first_name: "AdminFirst",
      last_name: "AdminLast",
      roles: [{ role: SystemRole.FACULTY }],
    });
    resolveAuthSessionFromUserMock.mockResolvedValue({
      primaryRole: "FACULTY",
      profileGate: { status: "COMPLETE" },
    });
    resolvePostLoginDestinationMock.mockReturnValue("/faculty/dashboard");

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&intent=faculty")
    );

    expect(updateUserMock).toHaveBeenCalledWith({
      where: { id: "domain-user-1" },
      data: {
        auth_user_id: VALID_UUID_1,
        first_name: "AdminFirst",
        last_name: "AdminLast",
      },
      include: { roles: true },
    });
    expect(response.headers.get("location")).toBe("https://cloie.test/faculty/dashboard");
  });

  it("redirects to role mismatch page when the intent does not match the stored role", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@acd.edu.ph" } },
    });
    findUniqueUserMock.mockResolvedValue({
      id: "domain-user-1",
      auth_user_id: VALID_UUID_1,
      email: "user@acd.edu.ph",
      roles: [{ role: SystemRole.FACULTY }],
    });

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&intent=student")
    );

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toContain("/login?error=role_mismatch");
  });

  it("uses resolvePostLoginDestination for successful redirects", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@acd.edu.ph" } },
    });
    findUniqueUserMock.mockResolvedValue({
      id: "domain-user-1",
      auth_user_id: VALID_UUID_1,
      email: "user@acd.edu.ph",
      roles: [{ role: SystemRole.FACULTY }],
    });
    resolveAuthSessionFromUserMock.mockResolvedValue({
      primaryRole: "FACULTY",
      profileGate: { status: "COMPLETE" },
    });
    resolvePostLoginDestinationMock.mockReturnValue("/faculty/dashboard");

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&next=%2Fdashboard&intent=faculty")
    );

    expect(resolvePostLoginDestinationMock).toHaveBeenCalledWith({
      requestedPath: "/dashboard",
      intent: "faculty",
      primaryRole: "FACULTY",
      profileGate: { status: "COMPLETE" },
    });
    expect(resolveAuthSessionFromUserMock).toHaveBeenCalledWith({
      id: VALID_UUID_1,
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
      data: { user: { id: VALID_UUID_1, email: "user@acd.edu.ph" } },
    });
    findUniqueUserMock.mockResolvedValue({
      id: "domain-user-1",
      auth_user_id: VALID_UUID_1,
      email: "user@acd.edu.ph",
      roles: [{ role: SystemRole.FACULTY }],
    });
    resolvePostLoginDestinationMock.mockReturnValue("/faculty/dashboard");

    const request = new Request("https://internal.example/api/auth/callback?code=abc", {
      headers: { "x-forwarded-host": "app.example.com" },
    });
    const response = await GET(request);

    expect(response.headers.get("location")).toBe("https://public.example/faculty/dashboard");
  });

  it("sanitizes malformed next values before redirecting", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@acd.edu.ph" } },
    });
    findUniqueUserMock.mockResolvedValue({
      id: "domain-user-1",
      auth_user_id: VALID_UUID_1,
      email: "user@acd.edu.ph",
      roles: [{ role: SystemRole.STUDENT }],
    });

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&next=profile")
    );

    expect(resolvePostLoginDestinationMock).toHaveBeenCalledWith({
      requestedPath: "profile",
      intent: null,
      primaryRole: "STUDENT",
      profileGate: { status: "COMPLETE" },
    });
    expect(response.headers.get("location")).toContain("/student/dashboard");
  });

  it("assigns role to roleless existing user when they log in with a valid self-service intent", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@acd.edu.ph" } },
    });
    findUniqueUserMock.mockResolvedValue({
      id: "domain-user-1",
      auth_user_id: VALID_UUID_1,
      email: "user@acd.edu.ph",
      roles: [],
    });
    createUserRoleMock.mockResolvedValue({
      id: "role-1",
      user_id: "domain-user-1",
      role: SystemRole.STUDENT,
    });
    resolveAuthSessionFromUserMock.mockResolvedValue({
      primaryRole: "STUDENT",
      profileGate: { status: "STUDENT_ONBOARDING_REQUIRED", intent: "student" },
    });
    resolvePostLoginDestinationMock.mockReturnValue("/onboarding?intent=student");

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&intent=student")
    );

    expect(createUserRoleMock).toHaveBeenCalledWith({
      data: {
        user_id: "domain-user-1",
        role: SystemRole.STUDENT,
      },
    });
    expect(response.headers.get("location")).toBe("https://cloie.test/onboarding?intent=student");
  });

  it("blocks roleless existing user claiming a pre-provisioned role", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@acd.edu.ph" } },
    });
    findUniqueUserMock.mockResolvedValue({
      id: "domain-user-1",
      auth_user_id: VALID_UUID_1,
      email: "user@acd.edu.ph",
      roles: [],
    });

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&intent=admin")
    );

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toContain("/login?error=pre_provisioning_required");
  });

  it("blocks roleless existing user claiming a self-service role with an invalid domain", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({
      error: null,
      data: { user: { id: VALID_UUID_1, email: "user@gmail.com" } },
    });
    findUniqueUserMock.mockResolvedValue({
      id: "domain-user-1",
      auth_user_id: VALID_UUID_1,
      email: "user@gmail.com",
      roles: [],
    });

    const response = await GET(
      new Request("https://cloie.test/api/auth/callback?code=abc&intent=student")
    );

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("location")).toContain("/login?error=invalid_domain");
  });
});
