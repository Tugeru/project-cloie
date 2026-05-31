"use server";

import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { isValidSemesterTerm, compareSemesters } from "@/lib/constants/academic-period";
import { canSetActiveTerm, canDeleteTermInstance } from "../policies";
import type {
  CreateTermInstanceInput,
  UpdateTermInstanceInput,
} from "../schemas/term-instance";

export type ServiceResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Verify admin authentication.
 */
async function verifyAdminAccess(): Promise<ServiceResult<{ userId: string }>> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.ADMIN)) {
    return { success: false, error: "Admin access required" };
  }

  return { success: true, data: { userId: session.userId } };
}

/**
 * Add a new Term Instance to a School Year.
 */
export async function addTermInstance(
  input: CreateTermInstanceInput
): Promise<ServiceResult<{ id: string }>> {
  const auth = await verifyAdminAccess();
  if (!auth.success) return auth;

  // Validate semester-term combination
  if (!isValidSemesterTerm(input.semester, input.term ?? null)) {
    return {
      success: false,
      error:
        input.semester === "SUMMER"
          ? "Summer semester cannot have a term"
          : "First and Second semesters must have a term",
    };
  }

  // Verify school year exists and is not archived
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { id: input.schoolYearId },
    select: { id: true, is_archived: true },
  });

  if (!schoolYear) {
    return { success: false, error: "School year not found" };
  }

  if (schoolYear.is_archived) {
    return { success: false, error: "Cannot add terms to an archived school year" };
  }

  try {
    const termInstance = await prisma.academicTermInstance.create({
      data: {
        school_year_id: input.schoolYearId,
        semester: input.semester,
        term: input.term ?? null,
        start_date: input.startDate ?? null,
        end_date: input.endDate ?? null,
        is_active: false,
      },
    });

    return { success: true, data: { id: termInstance.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: "A term instance with this semester and term already exists for this school year",
      };
    }
    throw error;
  }
}

/**
 * Update an existing Term Instance.
 */
export async function updateTermInstance(
  input: UpdateTermInstanceInput
): Promise<ServiceResult<{ id: string }>> {
  const auth = await verifyAdminAccess();
  if (!auth.success) return auth;

  const existing = await prisma.academicTermInstance.findUnique({
    where: { id: input.id },
    include: {
      school_year: {
        select: { is_archived: true },
      },
    },
  });

  if (!existing) {
    return { success: false, error: "Term instance not found" };
  }

  if (existing.school_year.is_archived) {
    return { success: false, error: "Cannot modify terms of an archived school year" };
  }

  const updated = await prisma.academicTermInstance.update({
    where: { id: input.id },
    data: {
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
    },
  });

  return { success: true, data: { id: updated.id } };
}

/**
 * Delete a Term Instance.
 */
export async function deleteTermInstance(id: string): Promise<ServiceResult> {
  const auth = await verifyAdminAccess();
  if (!auth.success) return auth;

  const existing = await prisma.academicTermInstance.findUnique({
    where: { id },
    include: {
      school_year: {
        select: { is_archived: true },
      },
    },
  });

  if (!existing) {
    return { success: false, error: "Term instance not found" };
  }

  if (existing.school_year.is_archived) {
    return { success: false, error: "Cannot delete terms of an archived school year" };
  }

  // Check if this is the active term
  const activeTerm = await prisma.academicTermInstance.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  // Check for dependent records (simplified - in production check enrollments/deployments)
  const hasDependents = await checkHasDependentRecords(id);

  const check = canDeleteTermInstance(id, activeTerm?.id ?? null, hasDependents);

  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  await prisma.academicTermInstance.delete({
    where: { id },
  });

  return { success: true, data: undefined };
}

/**
 * Set a Term Instance as the active term.
 * This transactionally clears any existing active term first.
 * Returns rolloverSuggested to prompt admin for term rollover (Phase 8).
 */
export async function setActiveTermInstance(
  termInstanceId: string
): Promise<ServiceResult<{ id: string; previousActiveId: string | null; rolloverSuggested: string | null }>> {
  const auth = await verifyAdminAccess();
  if (!auth.success) return auth;

  const termInstance = await prisma.academicTermInstance.findUnique({
    where: { id: termInstanceId },
    include: {
      school_year: {
        select: { is_archived: true, code: true, id: true },
      },
    },
  });

  if (!termInstance) {
    return { success: false, error: "Term instance not found" };
  }

  if (termInstance.school_year.is_archived) {
    return { success: false, error: "Cannot activate a term in an archived school year" };
  }

  // Get current active for validation (outside transaction is fine for this read-only check)
  const currentActive = await prisma.academicTermInstance.findFirst({
    where: { is_active: true },
    select: { id: true },
  });

  const check = canSetActiveTerm(
    termInstanceId,
    currentActive?.id ?? null,
    termInstance.semester,
    termInstance.term
  );

  if (!check.allowed) {
    return { success: false, error: check.reason };
  }

  // Transaction: clear existing active, set new active
  // Re-fetch currentActive inside transaction to prevent race conditions with concurrent requests
  const result = await prisma.$transaction(async (tx) => {
    // Get current active INSIDE transaction to prevent race conditions
    const currentActiveTx = await tx.academicTermInstance.findFirst({
      where: { is_active: true },
      select: { id: true },
    });

    // Clear existing active (if any) - using the transaction-fetched value
    if (currentActiveTx) {
      await tx.academicTermInstance.update({
        where: { id: currentActiveTx.id },
        data: { is_active: false },
      });
    }

    // Set new active
    const updated = await tx.academicTermInstance.update({
      where: { id: termInstanceId },
      data: { is_active: true },
    });

    return {
      id: updated.id,
      previousActiveId: currentActiveTx?.id ?? null,
    };
  });

  // Phase 8: Find next term in same school year for rollover suggestion
  // Fetch all inactive terms in the same school year and find the next one
  const allTerms = await prisma.academicTermInstance.findMany({
    where: {
      school_year_id: termInstance.school_year.id,
      is_active: false,
      id: { not: termInstanceId },
    },
    orderBy: [{ semester: "asc" }, { term: "asc" }],
    select: { id: true, semester: true, term: true },
  });

  // Find the first term that comes after the activated term
  const nextTerm = allTerms.find((t) => {
    const semesterComparison = compareSemesters(t.semester, termInstance.semester);

    if (semesterComparison > 0) return true;
    if (semesterComparison === 0 && termInstance.term && t.term) {
      const termOrder = ["FIRST", "SECOND"];
      return termOrder.indexOf(t.term) > termOrder.indexOf(termInstance.term);
    }
    return false;
  });

  return {
    success: true,
    data: {
      ...result,
      rolloverSuggested: nextTerm?.id ?? null,
    },
  };
}

/**
 * Check if a term instance has dependent records across all related tables.
 * Returns true if any enrollments, assignments, evaluations, or deployments reference this term.
 */
async function checkHasDependentRecords(termInstanceId: string): Promise<boolean> {
  const [enrollments, assignments, evaluations, deployments] = await Promise.all([
    prisma.studentEnrollment.count({ where: { term_instance_id: termInstanceId }, take: 1 }),
    prisma.courseAssignment.count({ where: { term_instance_id: termInstanceId }, take: 1 }),
    prisma.courseBoundEvaluation.count({ where: { term_instance_id: termInstanceId }, take: 1 }),
    prisma.centralDeployment.count({ where: { term_instance_id: termInstanceId }, take: 1 }),
  ]);

  return enrollments + assignments + evaluations + deployments > 0;
}

/**
 * Check if an error is a unique constraint violation.
 */
function isUniqueConstraintError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  );
}
