import { z } from "zod";

// ─── Shared Preprocessors ────────────────────────────────────────────────────

const optionalTextField = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  },
  z.string().max(1000).optional(),
);

const checkboxBoolean = z.preprocess(
  (value) => value === true || value === "true" || value === "on",
  z.boolean(),
);

// ─── Template Structure Schemas ──────────────────────────────────────────────

const likertDescriptorSchema = z.object({
  value: z.number().int().min(1).max(10),
  label: z.string().trim().min(1, "Descriptor label is required.").max(100),
});

export const templateQuestionSchema = z.object({
  key: z.string().min(1, "Question key is required."),
  prompt: z
    .string()
    .trim()
    .min(1, "Question title is required.")
    .max(500, "Question prompt must be 500 characters or fewer."),
  type: z.enum(["likert", "guided_open_ended"]),
  order: z.number().int().m in(0),
  required: z.boolean(),
  likertDescriptors: z.array(likertDescriptorSchema).optional(),
  suggestedResponses: z.array(z.string().trim().max(500)).optional(),
});

export const templateSectionSchema = z.object({
  key: z.string().min(1, "Section key is required."),
  title: z
    .string()
    .trim()
    .min(1, "Section title is required.")
    .max(200, "Section title must be 200 characters or fewer."),
  description: optionalTextField,
  order: z.number().int().min(0),
  questions: z
    .array(templateQuestionSchema)
    .min(1, "Each section must have at least one question."),
});

export const templateStructureSchema = z
  .array(templateSectionSchema)
  .min(1, "Template must have at least one section.");

// ─── Create / Update Schemas ─────────────────────────────────────────────────

export const createProgramHeadTemplateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Template name must be at least 3 characters.")
    .max(200, "Template name must be 200 characters or fewer."),
  description: optionalTextField,
  is_faculty_accessible: checkboxBoolean,
  structure: templateStructureSchema,
});

export const updateProgramHeadTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(3, "Template name must be at least 3 characters.")
    .max(200, "Template name must be 200 characters or fewer."),
  description: optionalTextField,
  is_faculty_accessible: checkboxBoolean,
  structure: templateStructureSchema,
});

// ─── Inferred Types ──────────────────────────────────────────────────────────

export type CreateProgramHeadTemplateInput = z.infer<
  typeof createProgramHeadTemplateSchema
>;
export type UpdateProgramHeadTemplateInput = z.infer<
  typeof updateProgramHeadTemplateSchema
>;
