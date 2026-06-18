import { CourseScope } from "@prisma/client";
import { ROLES } from "@/lib/constants/roles";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import type {
  CreateProgramHeadCourseInput,
  UpdateProgramHeadCourseInput,
} from "../schemas/program-head-course";

import { type ServiceResult } from "@/lib/utils/service-result";
import { isUniqueConstraintError } from "@/lib/utils/prisma-errors";

async function resolveAndValidatePHScope(
  userId: string
): Promise<ServiceResult<{ programIds: string[] }>> {
  const assignments = await prisma.programHeadAssignment.findMany({
    where: { program_head_id: userId, is_active: true },
    select: { program_id: true },
  });

  const programIds = [...new Set(assignments.map((a) => a.program_id))];

  if (programIds.length === 0) {
    return {
      success: false,
      error: "No active program assignment found for this Program Head.",
    };
  }

  return { success: true, data: { programIds } };
}

async function validateMajorBelongsToProgram(
  majorId: string,
  programIds: string[]
): Promise<ServiceResult<{ programId: string }>> {
  const major = await prisma.major.findUnique({
    where: { id: majorId },
    select: { id: true, program_id: true, is_active: true },
  });

  if (!major) {
    return { success: false, error: "Selected major was not found." };
  }

  if (!major.is_active) {
    return { success: false, error: "Selected major is not active." };
  }

  if (!programIds.includes(major.program_id)) {
    return {
      success: false,
      error: "Selected major does not belong to your assigned program.",
    };
  }

  return { success: true, data: { programId: major.program_id } };
}

export async function createProgramHeadCourse(
  input: CreateProgramHeadCourseInput
): Promise<ServiceResult<{ id: string }>> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.PROGRAM_HEAD)) {
    return {
      success: false,
      error: "Program Head authentication is required.",
    };
  }

  const scopeResult = await resolveAndValidatePHScope(session.userId);

  if (!scopeResult.success) {
    return scopeResult;
  }

  const { programIds } = scopeResult.data;

  // Determine program_id and major_id based on input
  let programId: string;
  let majorId: string | null = null;

  if (input.major_id) {
    const majorResult = await validateMajorBelongsToProgram(input.major_id, programIds);

    if (!majorResult.success) {
      return majorResult;
    }

    programId = majorResult.data.programId;
    majorId = input.major_id;
  } else {
    // Program-wide course: use first assigned program
    // (In multi-program PH scenario, we default to first — UI should present selector)
    programId = programIds[0];
  }

  try {
    const course = await prisma.course.create({
      data: {
        code: input.code,
        title: input.title,
        description: input.description ?? null,
        course_scope: CourseScope.PROGRAM_SPECIFIC,
        program_id: programId,
        major_id: majorId,
      },
    });

    return { success: true, data: { id: course.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A course with code "${input.code}" already exists.`,
      };
    }

    throw error;
  }
}

export async function updateProgramHeadCourse(
  input: UpdateProgramHeadCourseInput
): Promise<ServiceResult<{ id: string }>> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.PROGRAM_HEAD)) {
    return {
      success: false,
      error: "Program Head authentication is required.",
    };
  }

  const scopeResult = await resolveAndValidatePHScope(session.userId);

  if (!scopeResult.success) {
    return scopeResult;
  }

  const { programIds } = scopeResult.data;

  // Verify the existing course belongs to PH's program
  const existingCourse = await prisma.course.findUnique({
    where: { id: input.id },
    select: { id: true, program_id: true, course_scope: true },
  });

  if (!existingCourse) {
    return { success: false, error: "Course not found." };
  }

  if (existingCourse.course_scope === CourseScope.GENERAL_EDUCATION) {
    return {
      success: false,
      error: "General education courses cannot be modified by Program Heads.",
    };
  }

  if (!existingCourse.program_id || !programIds.includes(existingCourse.program_id)) {
    return {
      success: false,
      error: "You do not have permission to modify this course.",
    };
  }

  // Validate major if specified
  let majorId: string | null = null;

  if (input.major_id) {
    const majorResult = await validateMajorBelongsToProgram(input.major_id, programIds);

    if (!majorResult.success) {
      return majorResult;
    }

    majorId = input.major_id;
  }

  try {
    const course = await prisma.course.update({
      where: { id: input.id },
      data: {
        code: input.code,
        title: input.title,
        description: input.description ?? null,
        course_scope: CourseScope.PROGRAM_SPECIFIC,
        program_id: existingCourse.program_id,
        major_id: majorId,
      },
    });

    return { success: true, data: { id: course.id } };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        success: false,
        error: `A course with code "${input.code}" already exists.`,
      };
    }

    throw error;
  }
}

export async function toggleProgramHeadCourseActive(
  id: string,
  is_active: boolean
): Promise<ServiceResult> {
  const session = await resolveAuthSession();

  if (!session || !session.roles.includes(ROLES.PROGRAM_HEAD)) {
    return {
      success: false,
      error: "Program Head authentication is required.",
    };
  }

  const scopeResult = await resolveAndValidatePHScope(session.userId);

  if (!scopeResult.success) {
    return scopeResult;
  }

  const { programIds } = scopeResult.data;

  const existingCourse = await prisma.course.findUnique({
    where: { id },
    select: { id: true, program_id: true, course_scope: true },
  });

  if (!existingCourse) {
    return { success: false, error: "Course not found." };
  }

  if (existingCourse.course_scope === CourseScope.GENERAL_EDUCATION) {
    return {
      success: false,
      error: "General education courses cannot be modified by Program Heads.",
    };
  }

  if (!existingCourse.program_id || !programIds.includes(existingCourse.program_id)) {
    return {
      success: false,
      error: "You do not have permission to modify this course.",
    };
  }

  await prisma.course.update({
    where: { id },
    data: { is_active },
  });

  return { success: true, data: undefined };
}
