"use server";

import {
  saveStudentCourseBoundDraft,
  type SaveStudentCourseBoundDraftInput,
} from "@/modules/student-evaluation-workflow/services/save-student-course-bound-draft";
import {
  submitStudentCourseBoundResponse,
  type SubmitStudentCourseBoundResponseInput,
} from "@/modules/student-evaluation-workflow/services/submit-student-course-bound-response";

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
