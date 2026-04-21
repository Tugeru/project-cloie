"use server";

import { listFacultyCourseContexts } from "@/modules/deployments-and-targeting/services/list-faculty-course-contexts";
import {
  publishCourseBoundEvaluation,
} from "@/modules/deployments-and-targeting/services/publish-course-bound-evaluation";
import type { PublishCourseBoundEvaluationInput } from "@/modules/deployments-and-targeting/types";

export async function listFacultyCourseContextsAction() {
  return await listFacultyCourseContexts();
}

export async function publishCourseBoundEvaluationAction(
  payload: PublishCourseBoundEvaluationInput,
) {
  return await publishCourseBoundEvaluation(payload);
}
