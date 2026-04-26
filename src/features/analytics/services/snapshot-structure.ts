export type SnapshotItem = {
  kind: "quantitative" | "qualitative";
  key: string;
  prompt: string;
};

export type SnapshotSection = {
  key: string;
  title: string;
  items?: SnapshotItem[];
  questions?: Array<{
    key: string;
    type: string;
    prompt: string;
  }>;
  qualitative_prompts?: Array<{ key: string; prompt: string }>;
  quantitative_items?: Array<{ key: string; prompt: string }>;
};

export function isSnapshotSection(value: unknown): value is SnapshotSection {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const section = value as SnapshotSection;
  return typeof section.key === "string" && typeof section.title === "string";
}

export function getSnapshotSectionItems(section: SnapshotSection): SnapshotItem[] {
  // Modern format: items array with kind
  if (section.items) {
    return section.items;
  }

  // Questions format: questions array with type
  if (section.questions) {
    return section.questions.map((q) => ({
      kind: q.type === "likert" ? "quantitative" : "qualitative",
      key: q.key,
      prompt: q.prompt,
    }));
  }

  // Legacy format: separate arrays
  return [
    ...(section.quantitative_items ?? []).map((item) => ({
      kind: "quantitative" as const,
      key: item.key,
      prompt: item.prompt,
    })),
    ...(section.qualitative_prompts ?? []).map((item) => ({
      kind: "qualitative" as const,
      key: item.key,
      prompt: item.prompt,
    })),
  ];
}
