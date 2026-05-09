import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import { canManageCourseAssignment } from "../policies";
import type {
  CreateCourseAssignmentInput,
  UpdateCourseAssignmentInput,
  CourseAssignmentResult,
  BulkCreateResult,
} from "../types";

/**
 * Create a new course assignment.
 */
export async function createCourseAssignment(
  input: CreateCourseAssignmentInput
): Promise<CourseAssignmentResult<{ id: string }>> {
  const authSession = await resolveAuthSession();

  // Get course program for scope check
  const course = await prisma.course.findUnique({
    where: { id: input.courseId },
    select: { program_id: true },
  });

  if (!course) {
    return { success: false, error: "Course not found." };
  }

  // Check permissions
  const permission = canManageCourseAssignment(authSession, course.program_id);
  if (!permission.allowed) {
    return { success: false, error: permission.reason };
  }

  try {
    const assignment = await prisma.courseAssignment.create({
      data: {
        term_instance_id: input.termInstanceId,
        faculty_id: input.facultyId,
        course_id: input.courseId,
        program_id: input.programId,
        year_level: input.yearLevel,
        section: input.section ?? null,
        is_active: true,
        ...(authSession?.userId ? { assigned_by: authSession.userId } : {}),
      },
    });

    return { success: true, data: { id: assignment.id } };
  } catch (error) {
    // Handle unique constraint violation
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return { success: false, error: "Assignment already exists for this faculty/course combination." };
    }
    return { success: false, error: "Failed to create course assignment." };
  }
}

/**
 * Update an existing course assignment.
 */
export async function updateCourseAssignment(
  input: UpdateCourseAssignmentInput
): Promise<CourseAssignmentResult> {
  const authSession = await resolveAuthSession();

  // Get existing assignment
  const existing = await prisma.courseAssignment.findUnique({
    where: { id: input.assignmentId },
    include: { course: true },
  });

  if (!existing) {
    return { success: false, error: "Assignment not found." };
  }

  // Check permissions
  const permission = canManageCourseAssignment(authSession, existing.course.program_id);
  if (!permission.allowed) {
    return { success: false, error: permission.reason };
  }

  try {
    await prisma.courseAssignment.update({
      where: { id: input.assignmentId },
      data: {
        ...(input.programId && { program_id: input.programId }),
        ...(input.yearLevel && { year_level: input.yearLevel }),
        ...(input.section !== undefined && { section: input.section ?? null }),
      },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: "Failed to update course assignment." };
  }
}

/**
 * Deactivate a course assignment (soft delete).
 */
export async function deactivateCourseAssignment(
  assignmentId: string
): Promise<CourseAssignmentResult> {
  const authSession = await resolveAuthSession();

  // Get existing assignment
  const existing = await prisma.courseAssignment.findUnique({
    where: { id: assignmentId },
    include: { course: true },
  });

  if (!existing) {
    return { success: false, error: "Assignment not found." };
  }

  // Check permissions
  const permission = canManageCourseAssignment(authSession, existing.course.program_id);
  if (!permission.allowed) {
    return { success: false, error: permission.reason };
  }

  try {
    await prisma.courseAssignment.update({
      where: { id: assignmentId },
      data: { is_active: false },
    });

    return { success: true, data: undefined };
  } catch (error) {
    return { success: false, error: "Failed to deactivate course assignment." };
  }
}

/**
 * Bulk create course assignments with per-row error reporting.
 */
export async function bulkCreateCourseAssignments(
  inputs: CreateCourseAssignmentInput[]
): Promise<BulkCreateResult> {
  const authSession = await resolveAuthSession();

  if (!authSession?.roles?.some((r) => [ROLES.ADMIN, ROLES.DEAN, ROLES.PROGRAM_HEAD].includes(r))) {
    return { success: false, created: 0, errors: [{ index: -1, error: "Insufficient permissions." }] };
  }

  const errors: Array<{ index: number; error: string }> = [];
  let created = 0;

  // Process each assignment in a transaction
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];

    try {
      // Get course program for scope check
      const course = await prisma.course.findUnique({
        where: { id: input.courseId },
        select: { program_id: true },
      });

      if (!course) {
        errors.push({ index: i, error: "Course not found." });
        continue;
      }

      // Check permissions
      const permission = canManageCourseAssignment(authSession, course.program_id);
      if (!permission.allowed) {
        errors.push({ index: i, error: permission.reason });
        continue;
      }

      await prisma.courseAssignment.create({
        data: {
          term_instance_id: input.termInstanceId,
          faculty_id: input.facultyId,
          course_id: input.courseId,
          program_id: input.programId,
          year_level: input.yearLevel,
          section: input.section ?? null,
          is_active: true,
          ...(authSession?.userId ? { assigned_by: authSession.userId } : {}),
        },
      });

      created++;
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
        errors.push({ index: i, error: "Assignment already exists." });
      } else {
        errors.push({ index: i, error: "Failed to create assignment." });
      }
    }
  }

  return { success: errors.length === 0, created, errors };
}
