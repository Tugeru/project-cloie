/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createIndustryPartnerProfile } from "@/lib/actions/industry-partner-actions";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
    user: {
      upsert: vi.fn(),
    },
    industryPartnerProfile: {
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
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Industry Partner Actions", () => {
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
  });

  it("should fail if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No user" } });

    const result = await createIndustryPartnerProfile({
      first_name: "Jane",
      last_name: "Doe",
      company_name: "Test Corp",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication session invalid or missing.");
  });

  it("should fail validation for invalid data", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const result = await createIndustryPartnerProfile({
      company_name: "A", // Min length is 2
    } as any);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("should create profile and role successfully with minimal data", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: {
            full_name: "Jane Doe",
          },
        },
      },
      error: null,
    });

    const result = await createIndustryPartnerProfile({
      first_name: "Jane",
      last_name: "Doe",
      company_name: "Test Corp",
    });

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { auth_user_id: "user-123" },
      update: {
        first_name: "Jane",
        last_name: "Doe",
      },
      create: {
        auth_user_id: "user-123",
        email: "test@example.com",
        first_name: "Jane",
        last_name: "Doe",
      },
    });
    expect(prisma.industryPartnerProfile.upsert).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
      update: {
        company_name: "Test Corp",
        position: null,
        program_id: null,
      },
      create: {
        user_id: "user-123",
        company_name: "Test Corp",
        position: null,
        program_id: null,
      },
    });
    expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
    });
    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: {
        user_id: "user-123",
        role: ROLES.INDUSTRY_PARTNER,
      },
    });
  });

  it("should create profile and role successfully with all data", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: {
            full_name: "Jane Doe",
          },
        },
      },
      error: null,
    });

    const result = await createIndustryPartnerProfile({
      first_name: "Jane",
      last_name: "Doe",
      company_name: "Test Corp",
      position: "Manager",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.industryPartnerProfile.upsert).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
      update: {
        company_name: "Test Corp",
        position: "Manager",
        program_id: "550e8400-e29b-41d4-a716-446655440000",
      },
      create: {
        user_id: "user-123",
        company_name: "Test Corp",
        position: "Manager",
        program_id: "550e8400-e29b-41d4-a716-446655440000",
      },
    });
  });

  it("should return correct error when duplicate role exists", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    (prisma.$transaction as any).mockRejectedValue({ code: "P2002" });

    const result = await createIndustryPartnerProfile({
      first_name: "Jane",
      last_name: "Doe",
      company_name: "Test Corp",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("An unexpected error occurred while processing your request.");
  });

  it("should fail if the program does not exist", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });
    (prisma.program.findUnique as any).mockResolvedValue(null);

    const result = await createIndustryPartnerProfile({
      first_name: "Jane",
      last_name: "Doe",
      company_name: "Test Corp",
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

    const result = await createIndustryPartnerProfile({
      first_name: "Jane",
      last_name: "Doe",
      company_name: "Test Corp",
      program_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("The selected program is archived or inactive.");
  });

  it("should check if userRole exists before creating and skip creating if it exists", async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
          email: "test@example.com",
          user_metadata: {
            full_name: "Jane Doe",
          },
        },
      },
      error: null,
    });
    (prisma.userRole.findUnique as any).mockResolvedValue({
      id: "role-123",
      user_id: "user-123",
      role: ROLES.INDUSTRY_PARTNER,
    });

    const result = await createIndustryPartnerProfile({
      first_name: "Jane",
      last_name: "Doe",
      company_name: "Test Corp",
    });

    expect(result.success).toBe(true);
    expect(prisma.userRole.findUnique).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
    });
    expect(prisma.userRole.create).not.toHaveBeenCalled();
  });

  it("should log the error and return a generic fallback string when transaction fails with a non-P2002 error", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123", email: "test@example.com" } },
      error: null,
    });

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const customError = new Error("Database connection timeout");
    (prisma.$transaction as any).mockRejectedValue(customError);

    const result = await createIndustryPartnerProfile({
      first_name: "Jane",
      last_name: "Doe",
      company_name: "Test Corp",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("An unexpected error occurred while processing your request.");
    expect(consoleSpy).toHaveBeenCalledWith("Failed to create industry partner profile:", customError);
    consoleSpy.mockRestore();
  });
});

