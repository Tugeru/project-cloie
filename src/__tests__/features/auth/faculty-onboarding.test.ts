/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolveProfileGate } from "@/features/users/services/resolve-profile-gate";
import { resolvePostLoginDestination } from "@/features/auth/services/resolve-post-login-destination";
import { facultyProfileSchema } from "@/lib/schemas/faculty-profile";
import { createFacultyProfile } from "@/lib/actions/faculty-actions";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      upsert: vi.fn(),
    },
    userRole: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    facultyProgramAffiliation: {
      upsert: vi.fn(),
    },
    program: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("resolveProfileGate — Faculty", () => {
  it("returns FACULTY_ONBOARDING_REQUIRED when user has FACULTY role but hasFacultyAffiliation is false", () => {
    const result = resolveProfileGate({
      roles: [ROLES.FACULTY],
      activeRole: ROLES.FACULTY,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
      hasFacultyAffiliation: false,
    });
    expect(result).toEqual({ status: "FACULTY_ONBOARDING_REQUIRED", intent: "faculty" });
  });

  it("returns COMPLETE when user has FACULTY role and hasFacultyAffiliation is true", () => {
    const result = resolveProfileGate({
      roles: [ROLES.FACULTY],
      activeRole: ROLES.FACULTY,
      studentProfileId: null,
      alumniProfileId: null,
      industryPartnerProfileId: null,
      hasFacultyAffiliation: true,
    });
    expect(result).toEqual({ status: "COMPLETE" });
  });
});

describe("resolvePostLoginDestination — Faculty", () => {
  it("routes FACULTY_ONBOARDING_REQUIRED to /onboarding?intent=faculty", () => {
    const destination = resolvePostLoginDestination({
      requestedPath: "/portal",
      intent: null,
      activeRole: ROLES.FACULTY,
      profileGate: { status: "FACULTY_ONBOARDING_REQUIRED", intent: "faculty" },
    });
    expect(destination).toBe("/onboarding?intent=faculty");
  });
});

describe("facultyProfileSchema", () => {
  const validData = {
    first_name: "Jane",
    last_name: "Smith",
    program_id: "550e8400-e29b-41d4-a716-446655440000",
  };

  it("parses successfully with valid inputs", () => {
    const result = facultyProfileSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("fails when first name is too short", () => {
    const result = facultyProfileSchema.safeParse({ ...validData, first_name: "J" });
    expect(result.success).toBe(false);
  });

  it("fails when last name is too short", () => {
    const result = facultyProfileSchema.safeParse({ ...validData, last_name: "S" });
    expect(result.success).toBe(false);
  });

  it("fails when program_id is not a valid UUID", () => {
    const result = facultyProfileSchema.safeParse({ ...validData, program_id: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("createFacultyProfile Server Action", () => {
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockResolvedValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    // Mock transaction implementation
    (prisma.$transaction as any).mockImplementation(async (callback: any) => {
      return callback(prisma);
    });

    // Mock user.upsert implementation
    (prisma.user.upsert as any).mockResolvedValue({
      id: "faculty-123",
      email: "teacher@acd.edu.ph",
    });

    // Mock userRole.findUnique implementation
    (prisma.userRole.findUnique as any).mockResolvedValue(null);
  });

  it("should fail if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No user" } });

    const result = await createFacultyProfile({
      first_name: "Jane",
      last_name: "Smith",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication session invalid or missing.");
  });

  it("should fail if the program does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "faculty-123", email: "teacher@acd.edu.ph" } },
      error: null,
    });
    (prisma.program.findUnique as any).mockResolvedValue(null);

    const result = await createFacultyProfile({
      first_name: "Jane",
      last_name: "Smith",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("The selected program does not exist.");
  });

  it("should fail if the program is archived or inactive", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "faculty-123", email: "teacher@acd.edu.ph" } },
      error: null,
    });
    (prisma.program.findUnique as any).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: false,
    });

    const result = await createFacultyProfile({
      first_name: "Jane",
      last_name: "Smith",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("The selected program is archived or inactive.");
  });

  it("should create profile, role, and program affiliation successfully", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "faculty-123", email: "teacher@acd.edu.ph" } },
      error: null,
    });
    (prisma.program.findUnique as any).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: true,
    });

    const result = await createFacultyProfile({
      first_name: "Jane",
      last_name: "Smith",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { auth_user_id: "faculty-123" },
      update: {
        first_name: "Jane",
        last_name: "Smith",
      },
      create: {
        auth_user_id: "faculty-123",
        email: "teacher@acd.edu.ph",
        first_name: "Jane",
        last_name: "Smith",
      },
    });
    expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
      where: { user_id: "faculty-123" },
    });
    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: {
        user_id: "faculty-123",
        role: ROLES.FACULTY,
      },
    });
    expect(prisma.facultyProgramAffiliation.upsert).toHaveBeenCalledWith({
      where: {
        faculty_id_program_id: {
          faculty_id: "faculty-123",
          program_id: "550e8400-e29b-41d4-a716-446655440000",
        },
      },
      update: {
        is_primary: true,
        is_active: true,
      },
      create: {
        faculty_id: "faculty-123",
        program_id: "550e8400-e29b-41d4-a716-446655440000",
        is_primary: true,
        is_active: true,
      },
    });
  });

  it("should check if userRole exists before creating and skip creating if it exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "faculty-123", email: "teacher@acd.edu.ph" } },
      error: null,
    });
    (prisma.program.findUnique as any).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: true,
    });
    (prisma.userRole.findUnique as any).mockResolvedValue({
      id: "role-123",
      user_id: "faculty-123",
      role: ROLES.FACULTY,
    });

    const result = await createFacultyProfile({
      first_name: "Jane",
      last_name: "Smith",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
    expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
      where: { user_id: "faculty-123" },
    });
    expect(prisma.userRole.create).not.toHaveBeenCalled();
  });

  it("should return client-safe unexpected error message if database transaction fails", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "faculty-123", email: "teacher@acd.edu.ph" } },
      error: null,
    });
    (prisma.program.findUnique as any).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: true,
    });
    (prisma.$transaction as any).mockRejectedValue(new Error("Database connection error"));

    const result = await createFacultyProfile({
      first_name: "Jane",
      last_name: "Smith",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("An unexpected error occurred while processing your request.");
  });
});

