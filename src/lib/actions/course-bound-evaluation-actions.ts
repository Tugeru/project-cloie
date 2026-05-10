"use server";

import { listFacultyCourseContexts } from "@/features/evaluations/services/list-faculty-course-contexts";
import {
  loadFacultyManagedCilos,
  saveFacultyManagedCilos,
} from "@/features/evaluations/services/manage-faculty-cilos";
import { previewCourseBoundRespondents, previewCourseBoundRespondentsV2 } from "@/features/evaluations/services/preview-course-bound-respondents";
import { publishCourseBoundEvaluation, publishCourseBoundEvaluationV2 } from "@/features/evaluations/services/publish-course-bound-evaluation";
import type {
  FacultyManagedCiloContext,
  FacultyManagedCiloSaveInput,
  PreviewCourseBoundRespondentsInput,
  PreviewCourseBoundRespondentsInputV2,
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationInputV2,
} from "@/features/evaluations/types";

export async function listFacultyCourseContextsAction() {
  return await listFacultyCourseContexts();
}

export async function publishCourseBoundEvaluationAction(
  payload: PublishCourseBoundEvaluationInput
) {
  return await publishCourseBoundEvaluation(payload);
}

export async function previewCourseBoundRespondentsAction(
  payload: PreviewCourseBoundRespondentsInput
) {
  return await previewCourseBoundRespondents(payload);
}

// Phase 6: V2 actions using assignmentId
export async function previewCourseBoundRespondentsV2Action(
  payload: PreviewCourseBoundRespondentsInputV2
) {
  return await previewCourseBoundRespondentsV2(payload);
}

export async function publishCourseBoundEvaluationV2Action(
  payload: PublishCourseBoundEvaluationInputV2
) {
  return await publishCourseBoundEvaluationV2(payload);
}

export async function loadFacultyManagedCilosAction(payload: FacultyManagedCiloContext) {
  return await loadFacultyManagedCilos(payload);
}

async function saveFacultyManagedCilosAction(payload: FacultyManagedCiloSaveInput) {
  return await saveFacultyManagedCilos(payload);
}
