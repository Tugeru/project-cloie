import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { buildStudentEvaluationAnswerKey } from "@/features/responses/answer-keys";

type StructureSnapshotSection = {
  key: string;
  description?: string;
  items?: Array<{
    kind: "quantitative" | "qualitative";
    key: string;
    prompt: string;
    scale?: number[];
  }>;
  qualitative_prompts?: Array<{
    key: string;
    prompt: string;
  }>;
  quantitative_items?: Array<{
    key: string;
    prompt: string;
  }>;
  title: string;
};

type SubmittedResponseAnswers = Record<string, unknown>;

type BuildSubmittedResponseSectionsInput = {
  answers: SubmittedResponseAnswers;
  structureSnapshot: unknown;
};

export type SubmittedResponseSection = {
  id: string;
  name: string;
  description: string;
  items: Array<{
    kind: "quantitative" | "qualitative";
    itemKey?: string;
    promptKey?: string;
    prompt: string;
    answer: string | number | undefined;
  }>;
};

function isSnapshotSection(value: unknown): value is StructureSnapshotSection {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const section = value as StructureSnapshotSection;

  return typeof section.key === "string" && typeof section.title === "string";
}

export function buildSubmittedResponseSections({
  answers,
  structureSnapshot,
}: BuildSubmittedResponseSectionsInput): SubmittedResponseSection[] {
  if (!Array.isArray(structureSnapshot)) {
    return [];
  }

  return structureSnapshot.filter(isSnapshotSection).map((section) => ({
    id: section.key,
    name: section.title,
    description: section.description ?? "",
    items: (
      section.items ?? [
        ...(section.quantitative_items ?? []).map((item) => ({ kind: "quantitative" as const, key: item.key, prompt: item.prompt })),
        ...(section.qualitative_prompts ?? []).map((item) => ({ kind: "qualitative" as const, key: item.key, prompt: item.prompt })),
      ]
    ).map((item) => {
      const answerKey = item.kind === "quantitative"
        ? buildStudentEvaluationAnswerKey(section.key, "quantitative", item.key)
        : buildStudentEvaluationAnswerKey(section.key, "qualitative", item.key);
      
      const rawAnswer = answers[answerKey];
      
      let answer: string | number | undefined;
      if (item.kind === "quantitative") {
        answer = typeof rawAnswer === "number" ? rawAnswer : undefined;
      } else {
        const strAnswer = typeof rawAnswer === "string" ? rawAnswer : undefined;
        answer = strAnswer && strAnswer.trim().length > 0 ? strAnswer : undefined;
      }

      return {
        kind: item.kind,
        prompt: item.prompt,
        ...(item.kind === "quantitative" 
          ? { itemKey: item.key, answer: answer as number | undefined }
          : { promptKey: item.key, answer: answer as string | undefined }
        ),
      };
    }),
  }));
}

export type SubmittedResponseReview = {
  responseId: string;
  evaluationTitle: string;
  courseTitle: string;
  submittedAt: Date;
  sections: SubmittedResponseSection[];
};

export async function getStudentSubmittedResponseReview(
  responseId: string,
): Promise<SubmittedResponseReview | null> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return null;
  }

  const response = await prisma.response.findFirst({
    where: {
      id: responseId,
      respondent_id: authSession.userId,
      status: "SUBMITTED",
    },
    include: {
      assignment: {
        include: {
          course_bound: {
            include: {
              course: true,
              instrument: {
                include: {
                  template: true,
                },
              },
            },
          },
        },
      },
      qual_items: true,
      quant_items: true,
    },
  });

  if (!response?.assignment.course_bound || !response.submitted_at) {
    return null;
  }

  const answers: Record<string, string | number> = {};

  for (const item of response.quant_items) {
    answers[buildStudentEvaluationAnswerKey(item.section_key, "quantitative", item.item_key)] = item.rating_value;
  }

  for (const item of response.qual_items) {
    answers[buildStudentEvaluationAnswerKey(item.section_key, "qualitative", item.prompt_key)] = item.text_content;
  }

  return {
    courseTitle: response.assignment.course_bound.course.title,
    evaluationTitle: response.assignment.course_bound.instrument.template.name,
    responseId: response.id,
    sections: buildSubmittedResponseSections({
      answers,
      structureSnapshot: response.assignment.course_bound.instrument.structure_snapshot,
    }),
    submittedAt: response.submitted_at,
  };
}
