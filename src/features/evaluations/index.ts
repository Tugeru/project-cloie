/**
 * Evaluations Feature Module
 *
 * Manages course-bound evaluations, central deployments,
 * evaluation assignments, and targeting logic.
 */

// ─── Course-Bound Evaluations ────────────────────────────────────────────────

export { publishCourseBoundEvaluation } from "./services/publish-course-bound-evaluation";

export type {
  FacultyCourseContext,
  CourseBoundPublicationCiloInput,
  PublishCourseBoundEvaluationInput,
  PublishCourseBoundEvaluationResult,
} from "./types";

// ─── Central Deployments ─────────────────────────────────────────────────────

export {
  publishCentralDeployment,
  closeCentralDeployment,
} from "./services/publish-central-deployment";

export type {
  PublishCentralDeploymentResult,
  CloseCentralDeploymentResult,
} from "./services/publish-central-deployment";

// ─── Deployment Listing ──────────────────────────────────────────────────────

export { listProgramHeadDeployments } from "./services/list-program-head-deployments";

export type {
  ProgramHeadDeploymentItem,
  ListProgramHeadDeploymentsResult,
} from "./services/list-program-head-deployments";

export {
  publishCentralDeploymentSchema,
} from "./schemas/central-deployment";

export type {
  PublishCentralDeploymentInput,
} from "./schemas/central-deployment";

// ─── Components ──────────────────────────────────────────────────────────────

export { PublishCentralDeploymentForm } from "./components/publish-central-deployment-form";
