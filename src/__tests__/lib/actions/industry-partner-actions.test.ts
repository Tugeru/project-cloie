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
      upsert: vi.fn(),
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
  });

  it("should fail if user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: "No user" } });

    const result = await createIndustryPartnerProfile({
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
    });

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
      company_name: "Test Corp",
    });

    expect(result.success).toBe(true);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { auth_user_id: "user-123" },
      update: {},
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
    expect(prisma.userRole.upsert).toHaveBeenCalledWith({
      where: { user_id: "user-123" },
      update: { role: ROLES.INDUSTRY_PARTNER },
      create: {
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
      company_name: "Test Corp",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("You already have an industry partner profile.");
  });
});
