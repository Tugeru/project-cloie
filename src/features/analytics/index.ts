/**
 * Analytics Feature Module
 *
 * Handles mean-based quantitative computation, word cloud
 * generation, attainment summaries, and comparison analytics.
 */

// ─── Faculty Analytics ─────────────────────────────────────────────────────

export { listFacultyAnalyticsEvaluations } from "./services/list-faculty-analytics-evaluations";
export { getFacultyAnalyticsData } from "./services/get-faculty-analytics-data";

export type {
  FacultyAnalyticsEvaluationItem,
  FacultyAnalyticsData,
  FacultyCiloMetric,
  FacultyQuantitativeQuestion,
  ListFacultyAnalyticsEvaluationsResult,
  GetFacultyAnalyticsDataResult,
} from "./types";

export type { FacultyAnalyticsFilters } from "./services/list-faculty-analytics-evaluations";

// ─── Components ─────────────────────────────────────────────────────────────

export { FacultyAnalyticsDashboard } from "./components/faculty-analytics-dashboard";
export { FacultyAnalyticsFilters as FacultyAnalyticsFiltersComponent } from "./components/faculty-analytics-filters";
export { FacultyAnalyticsSummary } from "./components/faculty-analytics-summary";
export { FacultyCiloAnalyticsChart } from "./components/faculty-cilo-analytics-chart";
export { FacultyQualitativeCloud } from "./components/faculty-qualitative-cloud";
export { FacultyQuantitativeBreakdown } from "./components/faculty-quantitative-breakdown";
export { QualitativeWordCloud } from "./components/qualitative-word-cloud";
export { CourseMeanPieChart } from "./components/course-mean-pie-chart";
export { StakeholderMeanPieChart } from "./components/stakeholder-mean-pie-chart";
export { MeanBarChart } from "./components/mean-bar-chart";
