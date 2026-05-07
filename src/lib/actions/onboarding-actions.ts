"use server";

import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { studentProfileSchema, type StudentProfileInput } from "@/lib/schemas/student-profile";

export async function registerStudentProfile(data: StudentProfileInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { error: "Authentication session invalid or missing." };
    }

    const validatedData = studentProfileSchema.parse(data);

    // Determine current Academic Year
    // TODO: Tech Debt - This naive calendar-year logic fails for overlapping semesters
    // (e.g., enrolling in Jan 2027 for the 2nd semester of AY 2026-2027 yields "2027-2028").
    // Must be replaced with a central "Active Academic Term" global setting query.
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

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
        where: { user_id_role: { user_id: user.id, role: ROLES.STUDENT } },
        update: {},
        create: {
          user_id: user.id,
          role: ROLES.STUDENT,
        },
      });

      // 3. Construct Academic Profile parameters (Idempotent)
      await tx.studentAcademicProfile.upsert({
        where: { user_id: user.id },
        update: {
          program_id: validatedData.program_id,
          major_id: validatedData.major_id || null,
          year_level: validatedData.year_level,
          student_id_number: validatedData.student_id_number,
          academic_year: academicYear,
          section: validatedData.section,
        },
        create: {
          user_id: user.id,
          program_id: validatedData.program_id,
          major_id: validatedData.major_id || null,
          year_level: validatedData.year_level,
          student_id_number: validatedData.student_id_number,
          academic_year: academicYear,
          section: validatedData.section,
        },
      });
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to register student profile:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during database persistence.",
    };
  }
}
