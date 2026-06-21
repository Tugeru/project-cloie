"use server";

import { revalidatePath } from "next/cache";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { ROLES } from "@/lib/constants/roles";
import type { ZodType } from "zod";
import {
  createProgramHeadCourseSchema,
  updateProgramHeadCourseSchema,
} from "@/features/academic-structure/schemas/program-head-course";
import {
  createProgramHeadCourse,
  toggleProgramHeadCourseActive,
  updateProgramHeadCourse,
} from "@/features/academic-structure/services/manage-program-head-courses";

type ActionResult = { success: true } | { success: false; error: string };

function parseWithSchema<T>(
  schema: ZodType<T>,
  value: unknown
): { success: true; data: T } | { success: false; error: string } {
  const parsed = schema.safeParse(value);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  return parsed;
}

function revalidateProgramHeadCourses() {
  revalidatePath("/program-head/courses");
}

export async function createProgramHeadCourseAction(formData: FormData): Promise<ActionResult> {
  const session = await resolveAuthSession();
  if (!session || !session.activeRole) {
    return { error: "Authentication required.", success: false };
  }
  if (session.activeRole !== ROLES.PROGRAM_HEAD) {
    return { error: "Insufficient permissions.", success: false };
  }

  const parsed = parseWithSchema(createProgramHeadCourseSchema, {
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description"),
    course_scope: formData.get("course_scope"),
    major_id: formData.get("major_id"),
    default_year_level: formData.get("default_year_level"),
    default_semester: formData.get("default_semester"),
    default_term: formData.get("default_term"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await createProgramHeadCourse(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateProgramHeadCourses();
  return { success: true };
}

export async function updateProgramHeadCourseAction(formData: FormData): Promise<ActionResult> {
  const session = await resolveAuthSession();
  if (!session || !session.activeRole) {
    return { error: "Authentication required.", success: false };
  }
  if (session.activeRole !== ROLES.PROGRAM_HEAD) {
    return { error: "Insufficient permissions.", success: false };
  }

  const parsed = parseWithSchema(updateProgramHeadCourseSchema, {
    id: formData.get("id"),
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description"),
    course_scope: formData.get("course_scope"),
    major_id: formData.get("major_id"),
    default_year_level: formData.get("default_year_level"),
    default_semester: formData.get("default_semester"),
    default_term: formData.get("default_term"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await updateProgramHeadCourse(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateProgramHeadCourses();
  return { success: true };
}

export async function toggleProgramHeadCourseActiveAction(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const session = await resolveAuthSession();
  if (!session || !session.activeRole) {
    return { error: "Authentication required.", success: false };
  }
  if (session.activeRole !== ROLES.PROGRAM_HEAD) {
    return { error: "Insufficient permissions.", success: false };
  }

  const result = await toggleProgramHeadCourseActive(id, is_active);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateProgramHeadCourses();
  return { success: true };
}
