import { EnrollmentSource } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import type {
  EnrollmentResult,
  UpsertEnrollmentInput,
  AdminUpsertEnrollmentInput,
} from "../types";

/**
 * Upsert enrollment for the active term (used by onboarding).
 */
export async function upsertEnrollmentForActiveTerm(
  input: UpsertEnrollmentInput
): Promise<EnrollmentResult<{ id: string; isNew: boolean }>> {
  const result = await prisma.$transaction(async (tx) => {
    // Check if enrollment already exists for this student/term
    const existing = await tx.studentEnrollment.findUnique({
      where: {
        student_user_id_term_instance_id: {
          student_user_id: input.studentUserId,
          term_instance_id: input.termInstanceId,
        },
      },
    });

    if (existing) {
      // Update existing enrollment
      const updated = await tx.studentEnrollment.update({
        where: { id: existing.id },
        data: {
          program_id: input.programId,
          major_id: input.majorId ?? null,
          year_level: input.yearLevel,
          section: input.section ?? null,
          source: input.source,
          is_active: true,
        },
      });
      return { id: updated.id, isNew: false };
    }

    // Create new enrollment
    const created = await tx.studentEnrollment.create({
      data: {
        student_user_id: input.studentUserId,
        term_instance_id: input.termInstanceId,
        program_id: input.programId,
        major_id: input.majorId ?? null,
        year_level: input.yearLevel,
        section: input.section ?? null,
        source: input.source,
        is_active: true,
      },
    });

    return { id: created.id, isNew: true };
  });

  return { success: true, data: result };
}

/**
 * Admin upsert enrollment (can target any term).
 */
export async function adminUpsertEnrollment(
  input: AdminUpsertEnrollmentInput & { createdBy?: string }
): Promise<EnrollmentResult<{ id: string; isNew: boolean }>> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.SECRETARY)) {
    return { success: false, error: "Admin access required." };
  }

  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.studentEnrollment.findUnique({
      where: {
        student_user_id_term_instance_id: {
          student_user_id: input.studentUserId,
          term_instance_id: input.termInstanceId,
        },
      },
    });

    if (existing) {
      const updated = await tx.studentEnrollment.update({
        where: { id: existing.id },
        data: {
          program_id: input.programId,
          major_id: input.majorId ?? null,
          year_level: input.yearLevel,
          section: input.section ?? null,
          source: input.source,
          is_active: true,
          ...(input.createdBy ? { created_by: input.createdBy } : {}),
        },
      });
      return { id: updated.id, isNew: false };
    }

    const created = await tx.studentEnrollment.create({
      data: {
        student_user_id: input.studentUserId,
        term_instance_id: input.termInstanceId,
        program_id: input.programId,
        major_id: input.majorId ?? null,
        year_level: input.yearLevel,
        section: input.section ?? null,
        source: input.source,
        is_active: true,
        ...(input.createdBy ? { created_by: input.createdBy } : {}),
      },
    });

    return { id: created.id, isNew: true };
  });

  return { success: true, data: result };
}

/**
 * Deactivate an enrollment (soft delete - preserve history).
 */
export async function deactivateEnrollment(
  enrollmentId: string
): Promise<EnrollmentResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.SECRETARY)) {
    return { success: false, error: "Admin access required." };
  }

  try {
    await prisma.studentEnrollment.update({
      where: { id: enrollmentId },
      data: { is_active: false },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: "Failed to deactivate enrollment." };
  }
}

/**
 * Deactivate all enrollments for a user (used when deleting student context).
 */
export async function deactivateEnrollmentsForUser(
  userId: string
): Promise<EnrollmentResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.includes(ROLES.SECRETARY)) {
    return { success: false, error: "Admin access required." };
  }

  try {
    await prisma.studentEnrollment.updateMany({
      where: { student_user_id: userId, is_active: true },
      data: { is_active: false },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: "Failed to deactivate enrollments." };
  }
}
