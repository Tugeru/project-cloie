"use server";

import {
  saveCentralDeploymentDraft,
  type SaveCentralDeploymentDraftInput,
} from "@/features/responses/services/save-central-deployment-draft";
import {
  submitCentralDeploymentResponse,
  type SubmitCentralDeploymentResponseInput,
} from "@/features/responses/services/submit-central-deployment-response";

/**
 * Save a draft for a central deployment evaluation.
 *
 * Thin `"use server"` wrapper — authenticates via session, works for any
 * stakeholder role (ALUMNI, INDUSTRY_PARTNER, GRADUATING_STUDENT).
 */
export async function saveCentralDeploymentDraftAction(
  payload: SaveCentralDeploymentDraftInput,
) {
  return await saveCentralDeploymentDraft(payload);
}

/**
 * Submit a central deployment evaluation response.
 *
 * Thin `"use server"` wrapper — authenticates via session, works for any
 * stakeholder role (ALUMNI, INDUSTRY_PARTNER, GRADUATING_STUDENT).
 */
export async function submitCentralDeploymentResponseAction(
  payload: SubmitCentralDeploymentResponseInput,
) {
  return await submitCentralDeploymentResponse(payload);
}
