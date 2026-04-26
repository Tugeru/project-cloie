"use server";

import { revalidatePath } from "next/cache";
import {
  createProgramHeadTemplateSchema,
  updateProgramHeadTemplateSchema,
} from "@/features/instruments/schemas/program-head-template";
import {
  createProgramHeadTemplate,
  updateProgramHeadTemplate,
  duplicateTemplate,
  toggleTemplateActive,
  deleteProgramHeadTemplate,
  toggleFacultyAccessible,
} from "@/features/instruments/services/manage-program-head-templates";

type ActionResult = { success: true } | { success: false; error: string };

function revalidateTools() {
  revalidatePath("/program-head/tools");
}

export async function createProgramHeadTemplateAction(formData: FormData): Promise<ActionResult> {
  const rawStructure = formData.get("structure");
  let structure: unknown = [];

  try {
    structure = typeof rawStructure === "string" ? JSON.parse(rawStructure) : [];
  } catch {
    return { success: false, error: "Invalid template structure." };
  }

  const parsed = createProgramHeadTemplateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    template_type: formData.get("template_type"),
    is_faculty_accessible: formData.get("is_faculty_accessible"),
    structure,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const result = await createProgramHeadTemplate(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateTools();
  return { success: true };
}

export async function updateProgramHeadTemplateAction(formData: FormData): Promise<ActionResult> {
  const rawStructure = formData.get("structure");
  let structure: unknown = [];

  try {
    structure = typeof rawStructure === "string" ? JSON.parse(rawStructure) : [];
  } catch {
    return { success: false, error: "Invalid template structure." };
  }

  const parsed = updateProgramHeadTemplateSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    template_type: formData.get("template_type"),
    is_faculty_accessible: formData.get("is_faculty_accessible"),
    structure,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const result = await updateProgramHeadTemplate(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateTools();
  return { success: true };
}

export async function duplicateTemplateAction(templateId: string): Promise<ActionResult> {
  const result = await duplicateTemplate(templateId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateTools();
  return { success: true };
}

export async function toggleTemplateActiveAction(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const result = await toggleTemplateActive(id, is_active);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateTools();
  return { success: true };
}

export async function deleteTemplateAction(id: string): Promise<ActionResult> {
  const result = await deleteProgramHeadTemplate(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateTools();
  return { success: true };
}

export async function toggleFacultyAccessibleAction(
  id: string,
  is_faculty_accessible: boolean
): Promise<ActionResult> {
  const result = await toggleFacultyAccessible(id, is_faculty_accessible);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateTools();
  return { success: true };
}
