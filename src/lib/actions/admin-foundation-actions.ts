"use server";

import { InviteStatus, SystemRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import {
  createCourseSchema,
  updateCourseSchema,
} from "@/features/academic-structure/schemas/course";
import {
  createYearLevelSchema,
  updateYearLevelSchema,
} from "@/features/academic-structure/schemas/year-level";
import {
  createCourse,
  deleteCourse,
  toggleCourseActive,
  updateCourse,
} from "@/features/academic-structure/services/manage-courses";
import {
  createYearLevel,
  deleteYearLevel,
  updateYearLevel,
} from "@/features/academic-structure/services/manage-year-levels";
import {
  assignRoleSchema,
  createExternalInviteDraftSchema,
  createFacultyAffiliationSchema,
  createProgramHeadAssignmentSchema,
  updateIndustryPartnerProfileSchema,
  updateStudentAcademicContextSchema,
} from "@/features/users/schemas/admin-user";
import {
  assignUserRole,
  createExternalInviteDraft,
  createFacultyProgramAffiliation,
  createProgramHeadAssignment,
  deactivateFacultyProgramAffiliation,
  deactivateProgramHeadAssignment,
  deleteIndustryPartnerProfile,
  deleteStudentAcademicContext,
  revokeUserRole,
  toggleUserActive,
  updateExternalInviteStatus,
  upsertIndustryPartnerProfile,
  upsertStudentAcademicContext,
} from "@/features/users/services/manage-users";
import {
  createBaselineTemplateSchema,
  updateBaselineTemplateSchema,
} from "@/features/instruments/schemas/template";
import {
  createBaselineTemplate,
  toggleBaselineTemplateActive,
  updateBaselineTemplate,
} from "@/features/instruments/services/manage-instruments";

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

function revalidateAdminFoundation() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/year-levels");
  revalidatePath("/admin/users");
  revalidatePath("/admin/instruments");
}

export async function createCourseAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(createCourseSchema, {
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description"),
    course_scope: formData.get("course_scope"),
    program_id: formData.get("program_id"),
    major_id: formData.get("major_id"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await createCourse(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function updateCourseAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(updateCourseSchema, {
    id: formData.get("id"),
    code: formData.get("code"),
    title: formData.get("title"),
    description: formData.get("description"),
    course_scope: formData.get("course_scope"),
    program_id: formData.get("program_id"),
    major_id: formData.get("major_id"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await updateCourse(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function toggleCourseActiveAction(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const result = await toggleCourseActive(id, is_active);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function deleteCourseAction(id: string): Promise<ActionResult> {
  const result = await deleteCourse(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function createYearLevelAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(createYearLevelSchema, {
    name: formData.get("name"),
    order: formData.get("order"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await createYearLevel(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function updateYearLevelAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(updateYearLevelSchema, {
    id: formData.get("id"),
    name: formData.get("name"),
    order: formData.get("order"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await updateYearLevel(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function deleteYearLevelAction(id: string): Promise<ActionResult> {
  const result = await deleteYearLevel(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function toggleUserActiveAction(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const result = await toggleUserActive(id, is_active);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function assignUserRoleAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(assignRoleSchema, {
    user_id: formData.get("user_id"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await assignUserRole(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function revokeUserRoleAction(
  userId: string,
  role: SystemRole
): Promise<ActionResult> {
  const result = await revokeUserRole(userId, role);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function updateStudentAcademicContextAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseWithSchema(updateStudentAcademicContextSchema, {
    user_id: formData.get("user_id"),
    program_id: formData.get("program_id"),
    major_id: formData.get("major_id"),
    year_level_id: formData.get("year_level_id"),
    student_id_number: formData.get("student_id_number"),
    academic_year: formData.get("academic_year"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await upsertStudentAcademicContext(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function deleteStudentAcademicContextAction(userId: string): Promise<ActionResult> {
  const result = await deleteStudentAcademicContext(userId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function createFacultyProgramAffiliationAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseWithSchema(createFacultyAffiliationSchema, {
    faculty_id: formData.get("faculty_id"),
    program_id: formData.get("program_id"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await createFacultyProgramAffiliation(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function deactivateFacultyProgramAffiliationAction(id: string): Promise<ActionResult> {
  const result = await deactivateFacultyProgramAffiliation(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function createProgramHeadAssignmentAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(createProgramHeadAssignmentSchema, {
    program_head_id: formData.get("program_head_id"),
    program_id: formData.get("program_id"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await createProgramHeadAssignment(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function deactivateProgramHeadAssignmentAction(id: string): Promise<ActionResult> {
  const result = await deactivateProgramHeadAssignment(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function upsertIndustryPartnerProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = parseWithSchema(updateIndustryPartnerProfileSchema, {
    user_id: formData.get("user_id"),
    company_name: formData.get("company_name"),
    position: formData.get("position"),
    program_id: formData.get("program_id"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await upsertIndustryPartnerProfile(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function deleteIndustryPartnerProfileAction(userId: string): Promise<ActionResult> {
  const result = await deleteIndustryPartnerProfile(userId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function createExternalInviteDraftAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(createExternalInviteDraftSchema, {
    email: formData.get("email"),
    role: formData.get("role"),
    program_id: formData.get("program_id"),
    invitee_name: formData.get("invitee_name"),
    company_name: formData.get("company_name"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await createExternalInviteDraft(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function revokeExternalInviteAction(id: string): Promise<ActionResult> {
  const result = await updateExternalInviteStatus(id, InviteStatus.REVOKED);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function createBaselineTemplateAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(createBaselineTemplateSchema, {
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
    is_faculty_accessible: formData.get("is_faculty_accessible"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await createBaselineTemplate(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function updateBaselineTemplateAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(updateBaselineTemplateSchema, {
    id: formData.get("id"),
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
    is_faculty_accessible: formData.get("is_faculty_accessible"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await updateBaselineTemplate(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}

export async function toggleBaselineTemplateActiveAction(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const result = await toggleBaselineTemplateActive(id, is_active);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminFoundation();
  return { success: true };
}
