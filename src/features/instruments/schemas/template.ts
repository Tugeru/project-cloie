import { z } from "zod";

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

const templateFields = {
  code: z
    .string()
    .trim()
    .min(3, "Template code must be at least 3 characters.")
    .max(50, "Template code must be 50 characters or fewer.")
    .transform((value) => value.toUpperCase()),
  name: z
    .string()
    .trim()
    .min(3, "Template name must be at least 3 characters.")
    .max(200, "Template name must be 200 characters or fewer."),
  description: optionalTextField,
  is_faculty_accessible: checkboxBoolean,
};

export const createBaselineTemplateSchema = z.object(templateFields);

export const updateBaselineTemplateSchema = z.object({
  id: z.string().uuid(),
  ...templateFields,
});

export type CreateBaselineTemplateInput = z.infer<typeof createBaselineTemplateSchema>;
export type UpdateBaselineTemplateInput = z.infer<typeof updateBaselineTemplateSchema>;
