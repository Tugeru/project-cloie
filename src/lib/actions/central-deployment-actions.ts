"use server";

import { revalidatePath } from "next/cache";
import { publishCentralDeploymentSchema } from "@/features/evaluations/schemas/central-deployment";
import {
  publishCentralDeployment,
  closeCentralDeployment,
} from "@/features/evaluations/services/publish-central-deployment";

type ActionResult =
  | { success: true; deploymentId: string; assignmentCount: number; status: string }
  | { success: false; error: string };

type SimpleActionResult = { success: true } | { success: false; error: string };

export async function publishCentralDeploymentAction(
  formData: FormData,
): Promise<ActionResult> {
  const raw: Record<string, unknown> = {
    template_id: formData.get("template_id"),
    target_stakeholder: formData.get("target_stakeholder"),
    academic_year: formData.get("academic_year"),
    semester: formData.get("semester"),
  };

  const majorId = formData.get("major_id");
  if (majorId && typeof majorId === "string" && majorId.length > 0) {
    raw.major_id = majorId;
  }

  const yearLevelId = formData.get("year_level_id");
  if (yearLevelId && typeof yearLevelId === "string" && yearLevelId.length > 0) {
    raw.year_level_id = yearLevelId;
  }

  const activationDate = formData.get("activation_date") as string | null;
  const activationTime = formData.get("activation_time") as string | null;
  if (activationDate) {
    const dateTimeStr = activationTime
      ? `${activationDate}T${activationTime}`
      : `${activationDate}T00:00:00`;
    raw.activation_at = dateTimeStr;
  }

  const deadlineDate = formData.get("deadline_date") as string | null;
  const deadlineTime = formData.get("deadline_time") as string | null;
  if (deadlineDate) {
    const dateTimeStr = deadlineTime
      ? `${deadlineDate}T${deadlineTime}`
      : `${deadlineDate}T23:59:59`;
    raw.deadline_at = dateTimeStr;
  }

  const parsed = publishCentralDeploymentSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const result = await publishCentralDeployment(parsed.data);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/program-head/tools");
  revalidatePath("/program-head/deployments");

  return {
    success: true,
    deploymentId: result.data.deploymentId,
    assignmentCount: result.data.assignmentCount,
    status: result.data.status,
  };
}

export async function closeCentralDeploymentAction(
  deploymentId: string,
): Promise<SimpleActionResult> {
  if (!deploymentId || typeof deploymentId !== "string") {
    return { success: false, error: "Deployment ID is required." };
  }

  const result = await closeCentralDeployment(deploymentId);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/program-head/tools");
  return { success: true };
}
