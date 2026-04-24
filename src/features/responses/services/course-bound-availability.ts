import { DeploymentStatus } from "@prisma/client";

type DeploymentAvailabilityInput = {
  activation_at: Date | null;
  deadline_at: Date | null;
  status: DeploymentStatus;
};

export const STUDENT_EVALUATION_UNAVAILABLE_ERROR = "This evaluation is not currently available.";

export function isDeploymentAvailable(
  evaluation: DeploymentAvailabilityInput,
  now = new Date(),
) {
  if (
    evaluation.status !== DeploymentStatus.ACTIVE &&
    evaluation.status !== DeploymentStatus.SCHEDULED
  ) {
    return false;
  }

  if (evaluation.activation_at && evaluation.activation_at.getTime() > now.getTime()) {
    return false;
  }

  if (evaluation.deadline_at && evaluation.deadline_at.getTime() < now.getTime()) {
    return false;
  }

  return true;
}

export function isCourseBoundEvaluationAvailable(
  evaluation: DeploymentAvailabilityInput,
  now = new Date(),
) {
  return isDeploymentAvailable(evaluation, now);
}

export function isCentralDeploymentAvailable(
  evaluation: DeploymentAvailabilityInput,
  now = new Date(),
) {
  return isDeploymentAvailable(evaluation, now);
}
