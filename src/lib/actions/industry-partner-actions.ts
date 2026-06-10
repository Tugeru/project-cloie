"use server";

import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { industryPartnerProfileSchema, type IndustryPartnerProfileInput } from "@/lib/schemas/industry-partner-profile";

export async function createIndustryPartnerProfile(data: IndustryPartnerProfileInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { success: false, error: "Authentication session invalid or missing." };
    }

    const validatedData = industryPartnerProfileSchema.parse(data);

    // Verify program exists and is active (if provided)
    if (validatedData.program_id) {
      const program = await prisma.program.findUnique({
        where: { id: validatedData.program_id },
      });

      if (!program) {
        return { success: false, error: "The selected program does not exist." };
      }

      if (!program.is_active) {
        return { success: false, error: "The selected program is archived or inactive." };
      }
    }

    // Execute atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Find or Create domain User by Supabase auth_user_id
      const domainUser = await tx.user.upsert({
        where: { auth_user_id: user.id },
        update: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        },
        create: {
          auth_user_id: user.id,
          email: user.email!,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        },
      });

      // 2. Assign Global Role (Idempotent)
      await tx.userRole.upsert({
        where: { user_id: domainUser.id },
        update: { role: ROLES.INDUSTRY_PARTNER },
        create: {
          user_id: domainUser.id,
          role: ROLES.INDUSTRY_PARTNER,
        },
      });

      // 3. Create or Update Industry Partner Profile
      await tx.industryPartnerProfile.upsert({
        where: { user_id: domainUser.id },
        update: {
          company_name: validatedData.company_name,
          position: validatedData.position || null,
          program_id: validatedData.program_id || null,
        },
        create: {
          user_id: domainUser.id,
          company_name: validatedData.company_name,
          position: validatedData.position || null,
          program_id: validatedData.program_id || null,
        },
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create industry partner profile:", error);
    // Handle Prisma unique constraint violation
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "You already have an industry partner profile." };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during database persistence.",
    };
  }
}
