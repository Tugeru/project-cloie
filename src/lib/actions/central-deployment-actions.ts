"use server";

import { revalidatePath } from "next/cache";
import { publishCentralDeploymentSchema } from "@/features/evaluations/schemas/central-deployment";
import {
  publishCentralDeployment,
  closeCentralDeployment,
} from "@/features/evaluations/services/publish-central-deployment";
import { previewCentralDeploymentRespondents } from "@/features/evaluations/services/preview-central-deployment-respondents";
import type { PreviewCentralDeploymentInput } from "@/features/evaluations/types";

type ActionResult =
  | { success: true; deploymentId: string; assignmentCount: number; status: string }
  | { success: false; error: string };

type SimpleActionResult = { success: true } | { success: false; error: string };

export async function publishCentralDeploymentAction(formData: FormData): Promise<ActionResult> {
  const raw: Record<string, unknown> = {
    deployment_name: formData.get("deployment_name"),
    template_id: formData.get("template_id"),
    target_stakeholder: formData.get("target_stakeholder"),
    // Phase 7: Support term_instance_id (preferred) or legacy academic_year/semester
    term_instance_id: formData.get("term_instance_id"),
    academic_year: formData.get("academic_year"),
    semester: formData.get("semester"),
    term: formData.get("term"),
  };

  // Only include academic_year/semester if term_instance_id is not provided
  const termInstanceId = formData.get("term_instance_id");
  if (termInstanceId && typeof termInstanceId === "string" && termInstanceId.length > 0) {
    // Phase 7: term_instance_id takes precedence
    raw.term_instance_id = termInstanceId;
    // Clear legacy fields when term_instance_id is provided
    delete raw.academic_year;
    delete raw.semester;
    delete raw.term;
  }

  const majorId = formData.get("major_id");
  if (majorId && typeof majorId === "string" && majorId.length > 0) {
    raw.major_id = majorId;
  }

  const respondentIdsJson = formData.get("respondent_ids");
  if (respondentIdsJson && typeof respondentIdsJson === "string") {
    try {
      raw.respondent_ids = JSON.parse(respondentIdsJson);
    } catch {
      // Ignore malformed JSON — fall back to auto-resolve
    }
  }

  const yearLevel = formData.get("year_level");
  if (yearLevel && typeof yearLevel === "string" && yearLevel.length > 0) {
    raw.year_level = yearLevel;
  }

  const activationAt = formData.get("activation_at") as string | null;
  if (activationAt) {
    raw.activation_at = activationAt;
  }

  const deadlineAt = formData.get("deadline_at") as string | null;
  if (deadlineAt) {
    raw.deadline_at = deadlineAt;
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

export async function previewCentralDeploymentRespondentsAction(
  payload: PreviewCentralDeploymentInput
) {
  return await previewCentralDeploymentRespondents(payload);
}

export async function closeCentralDeploymentAction(
  deploymentId: string
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
