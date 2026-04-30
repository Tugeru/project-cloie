"use server";

import { revalidatePath } from "next/cache";
import type { ZodType } from "zod";
import { createGOSchema, updateGOSchema } from "@/features/outcomes/schemas/go";
import {
  createGO,
  deleteGO,
  reorderGOs,
  updateGO,
} from "@/features/outcomes/services/manage-program-head-outcomes";

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

function revalidateOutcomes() {
  revalidatePath("/program-head/outcomes");
}

export async function createGOAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(createGOSchema, {
    code: formData.get("code"),
    description: formData.get("description"),
    order: formData.get("order"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await createGO(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateOutcomes();
  return { success: true };
}

export async function updateGOAction(formData: FormData): Promise<ActionResult> {
  const parsed = parseWithSchema(updateGOSchema, {
    id: formData.get("id"),
    code: formData.get("code"),
    description: formData.get("description"),
    order: formData.get("order"),
  });

  if (!parsed.success) {
    return parsed;
  }

  const result = await updateGO(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateOutcomes();
  return { success: true };
}

export async function deleteGOAction(id: string): Promise<ActionResult> {
  const result = await deleteGO(id);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateOutcomes();
  return { success: true };
}

export async function reorderGOsAction(orderedIds: string[]): Promise<ActionResult> {
  const result = await reorderGOs(orderedIds);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidateOutcomes();
  return { success: true };
}
