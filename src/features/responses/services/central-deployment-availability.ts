/**
 * Central deployment availability check.
 *
 * Re-exports the shared `isCentralDeploymentAvailable` from the unified
 * deployment availability module and provides the central-deployment-specific
 * error constant.
 */

export { isCentralDeploymentAvailable } from "./course-bound-availability";

export const CENTRAL_DEPLOYMENT_UNAVAILABLE_ERROR = "This evaluation is not currently available.";
