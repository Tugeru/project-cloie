"use server";

import { revalidatePath } from "next/cache";
import {
  createBaselineTemplateWithStructureSchema,
  updateBaselineTemplateWithStructureSchema,
} from "@/features/instruments/schemas/template";
import {
  createBaselineTemplateWithStructure,
  updateBaselineTemplateWithStructure,
  toggleBaselineTemplateActive,
  duplicateBaselineTemplate,
  deleteBaselineTemplate,
} from "@/features/instruments/services/manage-instruments";

type ActionResult = { success: true } | { success: false; error: string };

function revalidateAdminTools() {
  revalidatePath("/admin/instruments");
}

export async function createAdminTemplateAction(
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    name: formData.get("name"),
    description: formData.get("description"),
    is_faculty_accessible: formData.get("is_faculty_accessible"),
    structure: JSON.parse((formData.get("structure") as string) || "[]"),
  };

  // Generate code from name
  const nameStr = typeof raw.name === "string" ? raw.name.trim() : "";
  const code = nameStr
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 50) || "TEMPLATE";

  const parsed = createBaselineTemplateWithStructureSchema.safeParse({
    ...raw,
    code,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const result = await createBaselineTemplateWithStructure(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminTools();
  return { success: true };
}

export async function updateAdminTemplateAction(
  formData: FormData,
): Promise<ActionResult> {
  const raw = {
    id: formData.get("id"),
    name: formData.get("name"),
    description: formData.get("description"),
    is_faculty_accessible: formData.get("is_faculty_accessible"),
    structure: JSON.parse((formData.get("structure") as string) || "[]"),
  };

  // Generate code from name
  const nameStr = typeof raw.name === "string" ? raw.name.trim() : "";
  const code = nameStr
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .substring(0, 50) || "TEMPLATE";

  const parsed = updateBaselineTemplateWithStructureSchema.safeParse({
    ...raw,
    code,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const result = await updateBaselineTemplateWithStructure(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminTools();
  return { success: true };
}

export async function toggleAdminTemplateActiveAction(
  id: string,
  is_active: boolean,
): Promise<ActionResult> {
  const result = await toggleBaselineTemplateActive(id, is_active);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminTools();
  return { success: true };
}

export async function duplicateAdminTemplateAction(
  id: string,
): Promise<ActionResult> {
  const result = await duplicateBaselineTemplate(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminTools();
  return { success: true };
}

export async function deleteAdminTemplateAction(
  id: string,
): Promise<ActionResult> {
  const result = await deleteBaselineTemplate(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateAdminTools();
  return { success: true };
}
