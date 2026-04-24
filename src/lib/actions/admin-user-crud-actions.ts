"use server";

import { revalidatePath } from "next/cache";
import { createAdminUserSchema } from "@/features/users/schemas/create-user";
import { createAdminUser } from "@/features/users/services/create-admin-user";

type ActionResult = { success: true } | { success: false; error: string };

export async function createAdminUserAction(formData: FormData): Promise<ActionResult> {
  const raw = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    role: formData.get("role"),
    program_ids: formData.getAll("program_ids").filter(Boolean),
    program_id: formData.get("program_id") || undefined,
    major_id: formData.get("major_id") || undefined,
  };

  const parsed = createAdminUserSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const result = await createAdminUser(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/admin/users");
  return { success: true };
}
