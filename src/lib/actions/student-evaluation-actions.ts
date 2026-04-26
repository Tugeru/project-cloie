"use server";

import {
  saveStudentEvaluationDraft,
  type SaveStudentEvaluationDraftInput,
} from "@/features/responses/services/save-student-evaluation-draft";
import {
  saveStudentCourseBoundDraft,
  type SaveStudentCourseBoundDraftInput,
} from "@/features/responses/services/save-student-course-bound-draft";
import {
  submitStudentEvaluationResponse,
  type SubmitStudentEvaluationResponseInput,
} from "@/features/responses/services/submit-student-evaluation-response";
import {
  submitStudentCourseBoundResponse,
  type SubmitStudentCourseBoundResponseInput,
} from "@/features/responses/services/submit-student-course-bound-response";

export async function saveStudentEvaluationDraftAction(payload: SaveStudentEvaluationDraftInput) {
  return await saveStudentEvaluationDraft(payload);
}

export async function saveStudentCourseBoundDraftAction(payload: SaveStudentCourseBoundDraftInput) {
  return await saveStudentCourseBoundDraft(payload);
}

export async function submitStudentEvaluationResponseAction(
  payload: SubmitStudentEvaluationResponseInput
) {
  return await submitStudentEvaluationResponse(payload);
}

export async function submitStudentCourseBoundResponseAction(
  payload: SubmitStudentCourseBoundResponseInput
) {
  return await submitStudentCourseBoundResponse(payload);
}
