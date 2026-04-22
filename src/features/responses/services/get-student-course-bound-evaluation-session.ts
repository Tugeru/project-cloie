import { prisma } from "@/lib/db/prisma";
import { resolveAuthSession } from "@/features/auth/services/resolve-auth-session";
import { buildStudentEvaluationAnswerKey } from "@/features/responses/answer-keys";
import type { StudentEvaluationSection, StudentEvaluationSession } from "@/features/responses/types";
import { isCourseBoundEvaluationAvailable } from "./course-bound-availability";

type QuantitativeSavedAnswerItem = {
  item_key: string;
  rating_value: number;
  section_key: string;
};

type QualitativeSavedAnswerItem = {
  prompt_key: string;
  section_key: string;
  text_content: string;
};

type StructureSnapshotSection = {
  key: string;
  title: string;
  description?: string;
  qualitative_prompts?: Array<{
    key: string;
    prompt: string;
  }>;
  quantitative_items?: Array<{
    key: string;
    prompt: string;
    scale?: number[];
  }>;
  items?: Array<{
    kind: "quantitative" | "qualitative";
    key: string;
    prompt: string;
    scale?: number[];
  }>;
};

type MapSavedAnswerItemsInput = {
  qualitativeItems: QualitativeSavedAnswerItem[];
  quantitativeItems: QuantitativeSavedAnswerItem[];
};

function isStructureSnapshotSection(value: unknown): value is StructureSnapshotSection {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const section = value as Record<string, unknown>;

  return typeof section.key === "string" && typeof section.title === "string";
}

export function mapStructureSnapshotToSections(
  structureSnapshot: unknown,
): StudentEvaluationSection[] {
  if (!Array.isArray(structureSnapshot)) {
    return [];
  }

  return structureSnapshot
    .filter(isStructureSnapshotSection)
    .map(({ key, title, description, items, qualitative_prompts, quantitative_items }) => ({
      id: key,
      name: title,
      description: description ?? "",
      items:
        items?.map((item) => {
          if (item.kind === "quantitative") {
            return { kind: "quantitative" as const, itemKey: item.key, prompt: item.prompt, scale: item.scale ?? [] };
          }
          return { kind: "qualitative" as const, promptKey: item.key, prompt: item.prompt };
        }) ?? [
          ...(quantitative_items ?? []).map((item) => ({
            kind: "quantitative" as const,
            itemKey: item.key,
            prompt: item.prompt,
            scale: item.scale ?? [],
          })),
          ...(qualitative_prompts ?? []).map((item) => ({
            kind: "qualitative" as const,
            prompt: item.prompt,
            promptKey: item.key,
          })),
        ],
    }));
}

export function mapSavedAnswerItems({
  qualitativeItems,
  quantitativeItems,
}: MapSavedAnswerItemsInput): Record<string, number | string> {
  const answers: Record<string, number | string> = {};

  for (const item of quantitativeItems) {
    answers[buildStudentEvaluationAnswerKey(item.section_key, "quantitative", item.item_key)] = item.rating_value;
  }

  for (const item of qualitativeItems) {
    answers[buildStudentEvaluationAnswerKey(item.section_key, "qualitative", item.prompt_key)] = item.text_content;
  }

  return answers;
}

function countSectionItems(sections: StudentEvaluationSection[]) {
  return sections.reduce((total, section) => total + section.items.length, 0);
}

export type StudentCourseBoundEvaluationSession = {
  assignmentId: string;
  evaluationTitle: string;
  courseTitle: string;
  programLabel: string;
  deadlineAt: Date | null;
  sections: StudentEvaluationSection[];
  session: StudentEvaluationSession;
  savedAnswers: Record<string, number | string>;
};

export async function getStudentCourseBoundEvaluationSession(
  assignmentId: string,
): Promise<StudentCourseBoundEvaluationSession | null> {
  const authSession = await resolveAuthSession();

  if (!authSession) {
    return null;
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
          course: true,
          instrument: {
            include: {
              template: true,
            },
          },
          major: true,
          program: true,
        },
      },
      response: {
        include: {
          qual_items: true,
          quant_items: true,
        },
      },
    },
  });

  if (!assignment?.course_bound) {
    return null;
  }

  if (!isCourseBoundEvaluationAvailable(assignment.course_bound)) {
    return null;
  }

  const sections = mapStructureSnapshotToSections(
    assignment.course_bound.instrument.structure_snapshot,
  );
  const response = assignment.response ?? null;
  const savedAnswers = response
    ? mapSavedAnswerItems({
        qualitativeItems: response.qual_items,
        quantitativeItems: response.quant_items,
      })
    : {};
  const answeredItems = response
    ? response.qual_items.length + response.quant_items.length
    : 0;

  return {
    assignmentId: assignment.id,
    courseTitle: assignment.course_bound.course.title,
    deadlineAt: assignment.course_bound.deadline_at,
    evaluationTitle: assignment.course_bound.instrument.template.name,
    programLabel: assignment.course_bound.major?.name ?? assignment.course_bound.program.name,
    savedAnswers,
    sections,
    session: {
      answeredItems,
      responseId: response?.id ?? null,
      submittedAt: response?.submitted_at ?? null,
      totalItems: countSectionItems(sections),
    },
  };
}
