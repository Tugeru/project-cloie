"use server";

import { listFacultyCourseContexts } from "@/features/evaluations/services/list-faculty-course-contexts";
import {
  loadFacultyManagedCilos,
  saveFacultyManagedCilos,
} from "@/features/evaluations/services/manage-faculty-cilos";
import { previewCourseBoundRespondents } from "@/features/evaluations/services/preview-course-bound-respondents";
import { publishCourseBoundEvaluation } from "@/features/evaluations/services/publish-course-bound-evaluation";
import type {
  FacultyManagedCiloContext,
  FacultyManagedCiloSaveInput,
  PreviewCourseBoundRespondentsInput,
  PublishCourseBoundEvaluationInput,
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

export async function loadFacultyManagedCilosAction(payload: FacultyManagedCiloContext) {
  return await loadFacultyManagedCilos(payload);
}

async function saveFacultyManagedCilosAction(payload: FacultyManagedCiloSaveInput) {
  return await saveFacultyManagedCilos(payload);
}
