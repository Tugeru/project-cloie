import { DeploymentType, ResponseStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { parseStudentEvaluationAnswerKey } from "@/features/responses/answer-keys";
import { isCentralDeploymentAvailable } from "./central-deployment-availability";
import { CENTRAL_DEPLOYMENT_UNAVAILABLE_ERROR } from "./central-deployment-availability";
import { assertSubmissionIsAllowed } from "./submit-student-course-bound-response";

// ─── Public types ───────────────────────────────────────────────────────────

export type SubmitCentralDeploymentResponseInput = {
  assignmentId: string;
  answers: Record<string, unknown>;
};

export type SubmitCentralDeploymentResponseResult =
  | {
      error: string;
      success: false;
    }
  | {
      responseId: string;
      status: "SUBMITTED";
      success: true;
    };

// ─── Service ────────────────────────────────────────────────────────────────

/**
 * Validate and finalize a central deployment response.
 *
 * Works for any stakeholder type (ALUMNI, INDUSTRY_PARTNER, GRADUATING_STUDENT).
 * Enforces one-response rule, validates all required items are answered,
 * and atomically upserts all response items + sets status to SUBMITTED.
 */
export async function submitCentralDeploymentResponse({
  answers,
  assignmentId,
}: SubmitCentralDeploymentResponseInput): Promise<SubmitCentralDeploymentResponseResult> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return {
      error: "Authentication is required.",
      success: false,
    };
  }

  const assignment = await prisma.evaluationAssignment.findFirst({
    where: {
      id: assignmentId,
      respondent_id: authSession.userId,
      central_deployment_id: { not: null },
    },
    include: {
      central_deployment: {
        include: {
          instrument: true,
        },
      },
    },
  });

  if (!assignment?.central_deployment) {
    return {
      error: "Evaluation assignment not found.",
      success: false,
    };
  }

  if (!isCentralDeploymentAvailable(assignment.central_deployment)) {
    return {
      error: CENTRAL_DEPLOYMENT_UNAVAILABLE_ERROR,
      success: false,
    };
  }

  assertSubmissionIsAllowed({
    answers,
    structureSnapshot: assignment.central_deployment.instrument.structure_snapshot,
  });

  let response = await prisma.response.findUnique({
    where: {
      assignment_id: assignment.id,
    },
  });

  if (response?.status === ResponseStatus.SUBMITTED) {
    return {
      error: "This evaluation has already been submitted.",
      success: false,
    };
  }

  if (!response) {
    response = await prisma.response.create({
      data: {
        assignment_id: assignment.id,
        deployment_id: assignment.central_deployment_id!,
        deployment_type: DeploymentType.CENTRAL,
        respondent_id: authSession.userId,
        status: ResponseStatus.IN_PROGRESS,
      },
    });
  }

  const quantitativeItems = Object.entries(answers)
    .map(([answerKey, value]) => {
      const parsed = parseStudentEvaluationAnswerKey(answerKey);

      if (!parsed || parsed.kind !== "quantitative" || typeof value !== "number") {
        return null;
      }

      return {
        item_key: parsed.itemKey,
        rating_value: value,
        response_id: response.id,
        section_key: parsed.sectionKey,
      };
    })
    .filter(
      (
        item,
      ): item is {
        item_key: string;
        rating_value: number;
        response_id: string;
        section_key: string;
      } => item !== null,
    );

  const qualitativeItems = Object.entries(answers)
    .map(([answerKey, value]) => {
      const parsed = parseStudentEvaluationAnswerKey(answerKey);

      if (!parsed || parsed.kind !== "qualitative" || typeof value !== "string") {
        return null;
      }

      return {
        prompt_key: parsed.itemKey,
        response_id: response.id,
        section_key: parsed.sectionKey,
        text_content: value,
      };
    })
    .filter(
      (
        item,
      ): item is {
        prompt_key: string;
        response_id: string;
        section_key: string;
        text_content: string;
      } => item !== null,
    );

  await prisma.quantitativeResponseItem.deleteMany({
    where: { response_id: response.id },
  });
  await prisma.qualitativeResponseItem.deleteMany({
    where: { response_id: response.id },
  });

  if (quantitativeItems.length > 0) {
    await prisma.quantitativeResponseItem.createMany({ data: quantitativeItems });
  }

  if (qualitativeItems.length > 0) {
    await prisma.qualitativeResponseItem.createMany({ data: qualitativeItems });
  }

  const submittedAt = new Date();

  await prisma.response.update({
    data: {
      status: ResponseStatus.SUBMITTED,
      submitted_at: submittedAt,
    },
    where: {
      id: response.id,
    },
  });

  return {
    responseId: response.id,
    status: ResponseStatus.SUBMITTED,
    success: true,
  };
}
