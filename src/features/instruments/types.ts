/**
 * Template Structure Types
 *
 * Defines the TypeScript types for the JSON `structure` field
 * stored in `InstrumentTemplate.structure` and frozen in
 * `InstrumentVersion.structure_snapshot`.
 */

export type QuestionType = "likert" | "guided_open_ended";

export interface LikertDescriptor {
  value: number;
  label: string;
}

export interface TemplateQuestion {
  /** UUID-like unique key */
  key: string;
  prompt: string;
  type: QuestionType;
  order: number;
  required: boolean;
  /** Descriptor labels for likert-type questions */
  likertDescriptors?: LikertDescriptor[];
  /** Predefined response options for guided_open_ended questions */
  suggestedResponses?: string[];
}

export interface TemplateSection {
  /** UUID-like unique key */
  key: string;
  title: string;
  description?: string;
  order: number;
  questions: TemplateQuestion[];
}

export type TemplateStructure = TemplateSection[];

// ─── Default Descriptors ──────────────────────────────────────────────────────

export const DEFAULT_LIKERT_5_DESCRIPTORS: LikertDescriptor[] = [
  { value: 1, label: "Strongly Disagree" },
  { value: 2, label: "Disagree" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Agree" },
  { value: 5, label: "Strongly Agree" },
];
