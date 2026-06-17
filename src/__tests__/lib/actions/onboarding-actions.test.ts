/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resetIncompleteRoleClaim, registerStudentProfile } from "@/lib/actions/onboarding-actions";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { createClient } from "@/lib/supabase/server";
import { getActiveTermId } from "@/features/academic-calendar/services/resolve-active-term";
import { upsertEnrollmentForActiveTerm } from "@/features/enrollments/services/manage-student-enrollments";
import { ROLES } from "@/lib/constants/roles";

const REDIRECT_ERROR = "NEXT_REDIRECT";

const {
  redirectMock,
  resolveAuthSessionMock,
  deleteManyUserRoleMock,
  upsertUserMock,
  upsertStudentProfileMock,
  upsertUserRoleMock,
  findUniqueProgramMock,
  findUniqueMajorMock,
  transactionMock,
  createClientMock,
  getActiveTermIdMock,
  upsertEnrollmentForActiveTermMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`${REDIRECT_ERROR}:${path}`);
  }),
  resolveAuthSessionMock: vi.fn(),
  deleteManyUserRoleMock: vi.fn(),
  upsertUserMock: vi.fn(),
  upsertStudentProfileMock: vi.fn(),
  upsertUserRoleMock: vi.fn(),
  findUniqueProgramMock: vi.fn(),
  findUniqueMajorMock: vi.fn(),
  transactionMock: vi.fn(),
  createClientMock: vi.fn(),
  getActiveTermIdMock: vi.fn(),
  upsertEnrollmentForActiveTermMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/features/auth/services/resolve-auth-session", () => ({
  resolveAuthSession: resolveAuthSessionMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

vi.mock("@/features/academic-calendar/services/resolve-active-term", () => ({
  getActiveTermId: getActiveTermIdMock,
}));

vi.mock("@/features/enrollments/services/manage-student-enrollments", () => ({
  upsertEnrollmentForActiveTerm: upsertEnrollmentForActiveTermMock,
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    user: {
      upsert: upsertUserMock,
    },
    studentAcademicProfile: {
      upsert: upsertStudentProfileMock,
    },
    userRole: {
      deleteMany: deleteManyUserRoleMock,
      upsert: upsertUserRoleMock,
    },
    program: {
      findUnique: findUniqueProgramMock,
    },
    major: {
      findUnique: findUniqueMajorMock,
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

describe("registerStudentProfile Server Action", () => {
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock.mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    transactionMock.mockImplementation(async (callback: any) => {
      return callback(prisma);
    });

    upsertUserMock.mockResolvedValue({
      id: "student-123",
      email: "student@acd.edu.ph",
    });

    findUniqueProgramMock.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: true,
    });

    findUniqueMajorMock.mockResolvedValue({
      id: "660e8400-e29b-41d4-a716-446655441111",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: true,
    });

    getActiveTermIdMock.mockResolvedValue("term-123");
    upsertEnrollmentForActiveTermMock.mockResolvedValue({ success: true });
  });

  it("should fail if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No user" } });

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("Authentication session invalid or missing.");
  });

  it("should fail if the program does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueProgramMock.mockResolvedValue(null);

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("The selected program does not exist.");
  });

  it("should fail if the program is archived or inactive", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueProgramMock.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: false,
    });

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("The selected program is archived or inactive.");
  });

  it("should fail if the major does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueMajorMock.mockResolvedValue(null);

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "660e8400-e29b-41d4-a716-446655441111",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("The selected major does not exist.");
  });

  it("should fail if the major is inactive", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueMajorMock.mockResolvedValue({
      id: "660e8400-e29b-41d4-a716-446655441111",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: false,
    });

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "660e8400-e29b-41d4-a716-446655441111",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("The selected major is archived or inactive.");
  });

  it("should fail if the major belongs to a different program", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acd.edu.ph" } },
      error: null,
    });
    findUniqueMajorMock.mockResolvedValue({
      id: "660e8400-e29b-41d4-a716-446655441111",
      program_id: "different-program-uuid",
      is_active: true,
    });

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "660e8400-e29b-41d4-a716-446655441111",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("The selected major does not belong to the selected program.");
  });

  it("should register student and create enrollment successfully if active term exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acd.edu.ph" } },
      error: null,
    });

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "660e8400-e29b-41d4-a716-446655441111",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBe(true);
    expect(transactionMock).toHaveBeenCalled();
    expect(upsertUserMock).toHaveBeenCalledWith({
      where: { auth_user_id: "student-123" },
      update: { first_name: "Jane", last_name: "Doe" },
      create: {
        auth_user_id: "student-123",
        email: "student@acd.edu.ph",
        first_name: "Jane",
        last_name: "Doe",
      },
    });
    expect(upsertStudentProfileMock).toHaveBeenCalledWith({
      where: { user_id: "student-123" },
      update: {
        program_id: "550e8400-e29b-41d4-a716-446655440000",
        major_id: "660e8400-e29b-41d4-a716-446655441111",
        student_id_number: "2026-0001",
      },
      create: {
        user_id: "student-123",
        program_id: "550e8400-e29b-41d4-a716-446655440000",
        major_id: "660e8400-e29b-41d4-a716-446655441111",
        student_id_number: "2026-0001",
      },
    });
    expect(upsertEnrollmentForActiveTermMock).toHaveBeenCalledWith({
      studentUserId: "student-123",
      termInstanceId: "term-123",
      programId: "550e8400-e29b-41d4-a716-446655440000",
      majorId: "660e8400-e29b-41d4-a716-446655441111",
      yearLevel: "FIRST_YEAR",
      section: "MORNING",
      source: "ONBOARDING",
    });
  });

  it("should register student and skip enrollment if no active term exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acd.edu.ph" } },
      error: null,
    });
    getActiveTermIdMock.mockResolvedValue(null);

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "",
      student_id_number: "2026-0001",
      year_level: "",
      section: "",
    });

    expect(result.success).toBe(true);
    expect(upsertStudentProfileMock).toHaveBeenCalled();
    expect(upsertEnrollmentForActiveTermMock).not.toHaveBeenCalled();
  });

  it("should fail if the student email domain is not authorized", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@gmail.com" } },
      error: null,
    });

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("Institutional email domain is required for student registration.");
  });

  it("should return failure result if upsertEnrollmentForActiveTerm fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acdeducation.com" } },
      error: null,
    });
    upsertEnrollmentForActiveTermMock.mockResolvedValue({
      success: false,
      error: "Enrollment transaction failed",
    });

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Enrollment transaction failed");
  });

  it("should return client-safe unexpected error message if database transaction fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "student-123", email: "student@acd.edu.ph" } },
      error: null,
    });
    transactionMock.mockRejectedValue(new Error("Db connection lost"));

    const result = await registerStudentProfile({
      first_name: "Jane",
      last_name: "Doe",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "",
      student_id_number: "2026-0001",
      year_level: "FIRST_YEAR",
      section: "MORNING",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("An unexpected error occurred while processing your request.");
  });
});
