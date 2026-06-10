"use server";

import { EnrollmentSource } from "@prisma/client";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { createClient } from "@/lib/supabase/server";
import {
  studentProfileSchema,
  deferredStudentProfileSchema,
  type StudentProfileInput,
  type DeferredStudentProfileInput,
} from "@/lib/schemas/student-profile";
import { getActiveTermId } from "@/features/academic-calendar/services/resolve-active-term";
import { upsertEnrollmentForActiveTerm } from "@/features/enrollments/services/manage-student-enrollments";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { redirect } from "next/navigation";

export async function registerStudentProfile(data: StudentProfileInput | DeferredStudentProfileInput) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return { error: "Authentication session invalid or missing." };
    }

    // Resolve active term for enrollment (deferred if none exists)
    const activeTermId = await getActiveTermId();

    // Choose validation schema based on whether there is an active term.
    // If no active term exists, year_level and section are not yet known.
    const schema = activeTermId ? studentProfileSchema : deferredStudentProfileSchema;
    const validatedData = schema.parse(data);

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
        update: { role: ROLES.STUDENT },
        create: {
          user_id: user.id,
          role: ROLES.STUDENT,
        },
      });

      // 3. Construct Academic Profile parameters (Idempotent)
      // Phase 9: Profile only holds static cohort fields - enrollment data is in StudentEnrollment
      await tx.studentAcademicProfile.upsert({
        where: { user_id: user.id },
        update: {
          program_id: validatedData.program_id,
          major_id: validatedData.major_id || null,
          student_id_number: validatedData.student_id_number,
        },
        create: {
          user_id: user.id,
          program_id: validatedData.program_id,
          major_id: validatedData.major_id || null,
          student_id_number: validatedData.student_id_number,
        },
      });

      // 4. Create enrollment for active term (outside transaction since it uses its own transaction)
    });

    // Create enrollment for active term (separate transaction) if active term exists.
    // When activeTermId is set we used studentProfileSchema which requires year_level and section.
    if (activeTermId) {
      const fullData = validatedData as StudentProfileInput;
      const enrollmentResult = await upsertEnrollmentForActiveTerm({
        studentUserId: user.id,
        termInstanceId: activeTermId,
        programId: fullData.program_id,
        majorId: fullData.major_id || null,
        yearLevel: fullData.year_level,
        section: fullData.section || null,
        source: EnrollmentSource.ONBOARDING,
      });

      if (!enrollmentResult.success) {
        console.error("Failed to create enrollment:", enrollmentResult.error);
        // Don't fail the entire registration, but log the error
      }
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

export async function resetIncompleteRoleClaim() {
  const session = await resolveAuthSession();

  if (session && session.profileGate.status !== "COMPLETE") {
    await prisma.userRole.deleteMany({
      where: { user_id: session.userId },
    });
  }

  redirect("/portal");
}
