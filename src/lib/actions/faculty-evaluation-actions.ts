"use server";

import { revalidatePath } from "next/cache";
import { listFacultyPublishedEvaluations } from "@/features/evaluations/services/list-faculty-published-evaluations";
import { getFacultyEvaluationDetail } from "@/features/evaluations/services/get-faculty-evaluation-detail";
import { closeFacultyEvaluation } from "@/features/evaluations/services/close-faculty-evaluation";
import type {
  ListFacultyPublishedEvaluationsResult,
  GetFacultyEvaluationDetailResult,
  CloseFacultyEvaluationResult,
} from "@/features/evaluations/types";

async function listFacultyPublishedEvaluationsAction(): Promise<ListFacultyPublishedEvaluationsResult> {
  return listFacultyPublishedEvaluations();
}

export async function getFacultyEvaluationDetailAction(
  evaluationId: string
): Promise<GetFacultyEvaluationDetailResult> {
  return getFacultyEvaluationDetail(evaluationId);
}

export async function closeFacultyEvaluationAction(
  evaluationId: string
): Promise<CloseFacultyEvaluationResult> {
  const result = await closeFacultyEvaluation(evaluationId);

  if (result.success) {
    revalidatePath("/faculty/tools");
  }

  return result;
}
