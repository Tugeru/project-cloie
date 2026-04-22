"use server";

import {
  saveStudentCourseBoundDraft,
  type SaveStudentCourseBoundDraftInput,
} from "@/features/responses/services/save-student-course-bound-draft";
import {
  submitStudentCourseBoundResponse,
  type SubmitStudentCourseBoundResponseInput,
} from "@/features/responses/services/submit-student-course-bound-response";

export async function saveStudentCourseBoundDraftAction(
  payload: SaveStudentCourseBoundDraftInput,
) {
  return await saveStudentCourseBoundDraft(payload);
}

export async function submitStudentCourseBoundResponseAction(
  payload: SubmitStudentCourseBoundResponseInput,
) {
  return await submitStudentCourseBoundResponse(payload);
}
