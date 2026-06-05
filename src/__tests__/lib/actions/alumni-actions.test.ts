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
      upsert: vi.fn(),
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
  });

  it("should fail if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No user" } });

    const result = await createAlumniProfile({
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
    });

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
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { id: "user-123" },
      update: {},
      create: {
        id: "user-123",
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
    expect(prisma.userRole.upsert).toHaveBeenCalledWith({
      where: { user_id_role: { user_id: "user-123", role: ROLES.ALUMNI } },
      update: {},
      create: {
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
    expect(prisma.userRole.upsert).toHaveBeenCalledWith({
      where: { user_id_role: { user_id: "user-123", role: ROLES.ALUMNI } },
      update: {},
      create: {
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
      graduation_year: 2020,
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("You already have an alumni profile.");
  });
});
