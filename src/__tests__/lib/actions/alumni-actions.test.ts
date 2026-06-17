/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createAlumniProfile } from "@/lib/actions/alumni-actions";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      upsert: vi.fn(),
    },
    alumniProfile: {
      upsert: vi.fn(),
    },
    userRole: {
      findUnique: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    program: {
      findUnique: vi.fn(),
    },
    major: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Alumni Actions", () => {
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
      id: "user-123",
      email: "test@example.com",
    });

    // Mock program.findUnique implementation
    (prisma.program.findUnique as any).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: true,
    });

    // Mock major.findUnique implementation
    (prisma.major.findUnique as any).mockResolvedValue({
      id: "660e8400-e29b-41d4-a716-446655441111",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: true,
    });
  });

  it("should fail if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No user" } });

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication session invalid or missing.");
  });

  it("should fail validation for invalid data", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const result = await createAlumniProfile({
      graduation_year: 1900, // Too early based on schema (min 1950)
      program_id: "not-a-uuid",
    } as any);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("should create profile and role successfully without major", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: {
            full_name: "John Doe",
          },
        },
      },
      error: null,
    });

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { auth_user_id: "user-123" },
      update: {
        first_name: "John",
        last_name: "Doe",
      },
      create: {
        auth_user_id: "user-123",
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
      },
    });
    expect(prisma.alumniProfile.upsert).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
      update: {
        graduation_year: 2020,
        program_id: "550e8400-e29b-41d4-a716-446655440000",
        major_id: null,
      },
      create: {
        user_id: "user-123",
        graduation_year: 2020,
        program_id: "550e8400-e29b-41d4-a716-446655440000",
        major_id: null,
      },
    });
    expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
    });
    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: {
        user_id: "user-123",
        role: ROLES.ALUMNI,
      },
    });
  });

  it("should create profile and role successfully with major", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: {
            full_name: "John Doe",
          },
        },
      },
      error: null,
    });

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "660e8400-e29b-41d4-a716-446655441111",
    });

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.alumniProfile.upsert).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
      update: {
        graduation_year: 2020,
        program_id: "550e8400-e29b-41d4-a716-446655440000",
        major_id: "660e8400-e29b-41d4-a716-446655441111",
      },
      create: {
        user_id: "user-123",
        graduation_year: 2020,
        program_id: "550e8400-e29b-41d4-a716-446655440000",
        major_id: "660e8400-e29b-41d4-a716-446655441111",
      },
    });
    expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
    });
    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: {
        user_id: "user-123",
        role: ROLES.ALUMNI,
      },
    });
  });

  it("should return correct error when duplicate role exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    (prisma.$transaction as any).mockRejectedValue({ code: "P2002" });

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("You already have an alumni profile.");
  });

  it("should fail if the program does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    (prisma.program.findUnique as any).mockResolvedValue(null);

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("The selected program does not exist.");
  });

  it("should fail if the program is archived or inactive", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    (prisma.program.findUnique as any).mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: false,
    });

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("The selected program is archived or inactive.");
  });

  it("should fail if the major does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    (prisma.major.findUnique as any).mockResolvedValue(null);

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "660e8400-e29b-41d4-a716-446655441111",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("The selected major does not exist.");
  });

  it("should fail if the major is inactive", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    (prisma.major.findUnique as any).mockResolvedValue({
      id: "660e8400-e29b-41d4-a716-446655441111",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      is_active: false,
    });

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "660e8400-e29b-41d4-a716-446655441111",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("The selected major is archived or inactive.");
  });

  it("should fail if the major belongs to a different program", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    (prisma.major.findUnique as any).mockResolvedValue({
      id: "660e8400-e29b-41d4-a716-446655441111",
      program_id: "different-program-id",
      is_active: true,
    });

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
      major_id: "660e8400-e29b-41d4-a716-446655441111",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("The selected major does not belong to the selected program.");
  });

  it("should check if userRole exists before creating and skip creating if it exists", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: {
            full_name: "John Doe",
          },
        },
      },
      error: null,
    });
    (prisma.userRole.findUnique as any).mockResolvedValue({
      id: "role-123",
      user_id: "user-123",
      role: ROLES.ALUMNI,
    });

    const result = await createAlumniProfile({
      first_name: "John",
      last_name: "Doe",
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
    expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
    });
    expect(prisma.userRole.create).not.toHaveBeenCalled();
  });
});

