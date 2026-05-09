"use server";

import { EnrollmentSource } from "@prisma/client";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import { studentProfileSchema, type StudentProfileInput } from "@/lib/schemas/student-profile";
import { getActiveTermId } from "@/features/academic-calendar/services/resolve-active-term";
import { upsertEnrollmentForActiveTerm } from "@/features/enrollments/services/manage-student-enrollments";

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

    // Resolve active term for enrollment
    const activeTermId = await getActiveTermId();
    if (!activeTermId) {
      return { error: "No active academic term is configured. Please contact an administrator." };
    }

    // Get school year code from active term
    const activeTerm = await prisma.academicTermInstance.findUnique({
      where: { id: activeTermId },
      include: { school_year: true },
    });
    const academicYear = activeTerm?.school_year?.code ?? `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

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

      // 4. Create enrollment for active term (outside transaction since it uses its own transaction)
    });

    // Create enrollment for active term (separate transaction)
    const enrollmentResult = await upsertEnrollmentForActiveTerm({
      studentUserId: user.id,
      termInstanceId: activeTermId,
      programId: validatedData.program_id,
      majorId: validatedData.major_id || null,
      yearLevel: validatedData.year_level,
      section: validatedData.section || null,
      source: EnrollmentSource.ONBOARDING,
    });

    if (!enrollmentResult.success) {
      console.error("Failed to create enrollment:", enrollmentResult.error);
      // Don't fail the entire registration, but log the error
    }

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
