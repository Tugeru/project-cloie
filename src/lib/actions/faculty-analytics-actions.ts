"use server";

import { revalidatePath } from "next/cache";
import {
  listFacultyAnalyticsEvaluations,
  FacultyAnalyticsFilters,
} from "@/features/analytics/services/list-faculty-analytics-evaluations";
import { getFacultyAnalyticsData } from "@/features/analytics/services/get-faculty-analytics-data";

export async function listFacultyAnalyticsEvaluationsAction(filters: FacultyAnalyticsFilters = {}) {
  const result = await listFacultyAnalyticsEvaluations(filters);
  return result;
}

export async function getFacultyAnalyticsDataAction(evaluationIds: string[]) {
  const result = await getFacultyAnalyticsData(evaluationIds);

  if (result.success) {
    revalidatePath("/faculty/analytics");
  }

  return result;
}
