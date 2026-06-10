"use server";

import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { facultyProfileSchema, type FacultyProfileInput } from "@/lib/schemas/faculty-profile";

export async function createFacultyProfile(data: FacultyProfileInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { success: false, error: "Authentication session invalid or missing." };
    }

    const validatedData = facultyProfileSchema.parse(data);

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

    // Execute atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create or Update User syncing the exact UUID from Supabase
      await tx.user.upsert({
        where: { id: user.id },
        update: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        },
        create: {
          id: user.id,
          email: user.email!,
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        },
      });

      // 2. Assign Global Role (Idempotent)
      await tx.userRole.upsert({
        where: { user_id: user.id },
        update: { role: ROLES.FACULTY },
        create: {
          user_id: user.id,
          role: ROLES.FACULTY,
        },
      });

      // 3. Create or Update Faculty Program Affiliation
      await tx.facultyProgramAffiliation.upsert({
        where: {
          faculty_id_program_id: {
            faculty_id: user.id,
            program_id: validatedData.program_id,
          },
        },
        update: {
          is_primary: true,
          is_active: true,
        },
        create: {
          faculty_id: user.id,
          program_id: validatedData.program_id,
          is_primary: true,
          is_active: true,
        },
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to create faculty profile:", error);
    // Handle Prisma unique constraint violation
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "You already have this faculty profile affiliation." };
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
