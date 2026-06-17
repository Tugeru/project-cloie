"use server";

import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { alumniProfileSchema, type AlumniProfileInput } from "@/lib/schemas/alumni-profile";

export async function createAlumniProfile(data: AlumniProfileInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { success: false, error: "Authentication session invalid or missing." };
    }

    const validatedData = alumniProfileSchema.parse(data);

    // Verify program exists and is active
    const program = await prisma.program.findUnique({
      where: { id: validatedData.program_id },
    });

    if (!program) {
      return { success: false, error: "The selected program does not exist." };
    }

    if (!program.is_active) {
      return { success: false, error: "The selected program is archived or inactive." };
    }

    // Verify major exists, is active, and belongs to program
    if (validatedData.major_id) {
      const major = await prisma.major.findUnique({
        where: { id: validatedData.major_id },
      });

      if (!major) {
        return { success: false, error: "The selected major does not exist." };
      }

      if (!major.is_active) {
        return { success: false, error: "The selected major is archived or inactive." };
      }

      if (major.program_id !== validatedData.program_id) {
        return { success: false, error: "The selected major does not belong to the selected program." };
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

      // 2. Assign Global Role (Idempotent check to prevent role-overwriting)
      const existingRole = await tx.userRole.findUnique({
        where: { user_id: domainUser.id },
      });
      if (!existingRole) {
        await tx.userRole.create({
          data: {
            user_id: domainUser.id,
            role: ROLES.ALUMNI,
          },
        });
      }

      // 3. Create or Update Alumni Profile
      await tx.alumniProfile.upsert({
        where: { user_id: domainUser.id },
        update: {
          graduation_year: validatedData.graduation_year,
          program_id: validatedData.program_id,
          major_id: validatedData.major_id || null,
        },
        create: {
          user_id: domainUser.id,
          graduation_year: validatedData.graduation_year,
          program_id: validatedData.program_id,
          major_id: validatedData.major_id || null,
        },
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create alumni profile:", error);
    // Handle Prisma unique constraint violation (e.g., role or profile already exists)
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "You already have an alumni profile." };
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
