"use server";

import { listFacultyCourseContexts } from "@/features/evaluations/services/list-faculty-course-contexts";
import {
  publishCourseBoundEvaluation,
} from "@/features/evaluations/services/publish-course-bound-evaluation";
import type { PublishCourseBoundEvaluationInput } from "@/features/evaluations/types";

export async function listFacultyCourseContextsAction() {
  return await listFacultyCourseContexts();
}

export async function publishCourseBoundEvaluationAction(
  payload: PublishCourseBoundEvaluationInput,
) {
  return await publishCourseBoundEvaluation(payload);
}
