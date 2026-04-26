import { DeploymentType, ResponseStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { parseStudentEvaluationAnswerKey } from "@/features/responses/answer-keys";
import {
  isCourseBoundEvaluationAvailable,
  STUDENT_EVALUATION_UNAVAILABLE_ERROR,
} from "./course-bound-availability";

type StructureSnapshotItem = {
  key: string;
  kind?: "quantitative" | "qualitative";
};

type StructureSnapshotSection = {
  items?: StructureSnapshotItem[];
  key: string;
  qualitative_prompts?: unknown;
  quantitative_items?: unknown;
};

type SubmissionAnswers = Record<string, unknown>;

export type SubmitStudentCourseBoundResponseInput = {
  assignmentId: string;
  answers: SubmissionAnswers;
};

export type SubmitStudentCourseBoundResponseResult =
  | {
      error: string;
      success: false;
    }
  | {
      responseId: string;
      status: "SUBMITTED";
      success: true;
    };

type AssertSubmissionIsAllowedInput = {
  answers: SubmissionAnswers;
  structureSnapshot: unknown;
};

type BuildSubmittedResponsePatchInput = {
  submittedAt: string;
};

type SubmittedResponsePatch = {
  status: "SUBMITTED";
  submittedAt: string;
};

function isSnapshotItem(value: unknown): value is StructureSnapshotItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return typeof (value as StructureSnapshotItem).key === "string";
}

function isSnapshotSection(value: unknown): value is StructureSnapshotSection {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return typeof (value as StructureSnapshotSection).key === "string";
}

function buildAnswerKey(sectionKey: string, kind: "quantitative" | "qualitative", itemKey: string) {
  return `${sectionKey}:${kind}:${itemKey}`;
}

function hasAnswerValue(kind: "quantitative" | "qualitative", value: unknown) {
  if (kind === "quantitative") {
    return typeof value === "number" && Number.isFinite(value);
  }

  return typeof value === "string" && value.trim().length > 0;
}

function getSnapshotItems(items: unknown): StructureSnapshotItem[] {
  return Array.isArray(items) ? items.filter(isSnapshotItem) : [];
}

export function assertSubmissionIsAllowed({
  answers,
  structureSnapshot,
}: AssertSubmissionIsAllowedInput): void {
  const missingAnswerKeys = Array.isArray(structureSnapshot)
    ? structureSnapshot.filter(isSnapshotSection).flatMap((section) => [
        ...(Array.isArray(section.items)
          ? section.items
              .filter((item) => item.kind === "quantitative")
              .map((item) => buildAnswerKey(section.key, "quantitative", item.key))
              .filter((answerKey) => !hasAnswerValue("quantitative", answers[answerKey]))
          : getSnapshotItems(section.quantitative_items)
          .map((item) => buildAnswerKey(section.key, "quantitative", item.key))
          .filter((answerKey) => !hasAnswerValue("quantitative", answers[answerKey]))),
        ...(Array.isArray(section.items)
          ? section.items
              .filter((item) => item.kind === "qualitative")
              .map((item) => buildAnswerKey(section.key, "qualitative", item.key))
              .filter((answerKey) => !hasAnswerValue("qualitative", answers[answerKey]))
          : getSnapshotItems(section.qualitative_prompts)
          .map((item) => buildAnswerKey(section.key, "qualitative", item.key))
          .filter((answerKey) => !hasAnswerValue("qualitative", answers[answerKey]))),
      ])
    : [];

  if (missingAnswerKeys.length > 0) {
    throw new Error(`Missing required answers: ${missingAnswerKeys.join(", ")}`);
  }
}

export function buildSubmittedResponsePatch({
  submittedAt,
}: BuildSubmittedResponsePatchInput): SubmittedResponsePatch {
  return {
    status: ResponseStatus.SUBMITTED,
    submittedAt,
  };
}

export async function submitStudentCourseBoundResponse({
  answers,
  assignmentId,
}: SubmitStudentCourseBoundResponseInput): Promise<SubmitStudentCourseBoundResponseResult> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return {
      error: "Authentication is required.",
      success: false,
    };
  }

  const assignment = await prisma.evaluationAssignment.findFirst({
    where: {
      course_bound_id: { not: null },
      id: assignmentId,
      respondent_id: authSession.userId,
    },
    include: {
      course_bound: {
        include: {
          cilo_question_bindings: true,
          instrument: true,
        },
      },
    },
  });

  if (!assignment?.course_bound) {
    return {
      error: "Evaluation assignment not found.",
      success: false,
    };
  }

  if (!isCourseBoundEvaluationAvailable(assignment.course_bound)) {
    return {
      error: STUDENT_EVALUATION_UNAVAILABLE_ERROR,
      success: false,
    };
  }

  assertSubmissionIsAllowed({
    answers,
    structureSnapshot: assignment.course_bound.instrument.structure_snapshot,
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
        deployment_id: assignment.course_bound_id!,
        deployment_type: DeploymentType.COURSE_BOUND,
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

      const ciloBinding = (assignment.course_bound?.cilo_question_bindings ?? []).find(
        (binding) =>
          binding.section_key === parsed.sectionKey &&
          binding.item_key === parsed.itemKey,
      );

      return {
        cilo_question_binding_id: ciloBinding?.id ?? null,
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
        cilo_question_binding_id: string | null;
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
    .filter((item): item is { prompt_key: string; response_id: string; section_key: string; text_content: string } => item !== null);

  await prisma.quantitativeResponseItem.deleteMany({ where: { response_id: response.id } });
  await prisma.qualitativeResponseItem.deleteMany({ where: { response_id: response.id } });

  if (quantitativeItems.length > 0) {
    await prisma.quantitativeResponseItem.createMany({ data: quantitativeItems });
  }

  if (qualitativeItems.length > 0) {
    await prisma.qualitativeResponseItem.createMany({ data: qualitativeItems });
  }

  const submittedAt = new Date().toISOString();

  await prisma.response.update({
    data: {
      status: ResponseStatus.SUBMITTED,
      submitted_at: new Date(submittedAt),
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
