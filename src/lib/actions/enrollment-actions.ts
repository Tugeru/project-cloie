"use server";

import { revalidatePath } from "next/cache";
import {
  adminUpsertEnrollmentSchema,
  deactivateEnrollmentSchema,
} from "@/features/enrollments/schemas/enrollment";
import {
  adminUpsertEnrollment,
  deactivateEnrollment,
} from "@/features/enrollments/services/manage-student-enrollments";
import { listEnrollmentsForUser } from "@/features/enrollments/services/list-enrollments";
import type { AdminUpsertEnrollmentInput, DeactivateEnrollmentInput } from "@/features/enrollments/schemas/enrollment";

/**
 * Admin action: Create or update a student enrollment.
 */
export async function adminUpsertEnrollmentAction(input: AdminUpsertEnrollmentInput) {
  const parsed = adminUpsertEnrollmentSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await adminUpsertEnrollment(parsed.data);

  if (result.success) {
    revalidatePath("/secretary/users");
    revalidatePath("/secretary/school-years");
  }

  return result;
}

/**
 * Admin action: Deactivate an enrollment.
 */
export async function deactivateEnrollmentAction(input: DeactivateEnrollmentInput) {
  const parsed = deactivateEnrollmentSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await deactivateEnrollment(parsed.data.enrollmentId);

  if (result.success) {
    revalidatePath("/secretary/users");
    revalidatePath("/secretary/school-years");
  }

  return result;
}

/**
 * Action: List enrollments for a user.
 */
export async function listEnrollmentsForUserAction(userId: string) {
  return listEnrollmentsForUser(userId);
}
