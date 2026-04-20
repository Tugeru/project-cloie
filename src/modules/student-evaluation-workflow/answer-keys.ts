export type StudentEvaluationAnswerKind = "quantitative" | "qualitative";

export function buildStudentEvaluationAnswerKey(
  sectionKey: string,
  kind: StudentEvaluationAnswerKind,
  itemKey: string,
) {
  return `${sectionKey}:${kind}:${itemKey}`;
}

export function parseStudentEvaluationAnswerKey(answerKey: string): {
  itemKey: string;
  kind: StudentEvaluationAnswerKind;
  sectionKey: string;
} | null {
  const [sectionKey, kind, ...itemKeyParts] = answerKey.split(":");

  if (
    !sectionKey ||
    (kind !== "quantitative" && kind !== "qualitative") ||
    itemKeyParts.length === 0
  ) {
    return null;
  }

  return {
    itemKey: itemKeyParts.join(":"),
    kind,
    sectionKey,
  };
}
