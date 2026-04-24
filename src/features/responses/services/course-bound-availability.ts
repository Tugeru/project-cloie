import { DeploymentStatus } from "@prisma/client";

type CourseBoundAvailabilityInput = {
  activation_at: Date | null;
  deadline_at: Date | null;
  status: DeploymentStatus;
};

export const STUDENT_EVALUATION_UNAVAILABLE_ERROR = "This evaluation is not currently available.";

export function isCourseBoundEvaluationAvailable(
  evaluation: CourseBoundAvailabilityInput,
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
