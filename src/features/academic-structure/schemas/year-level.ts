import { z } from "zod";

export const createYearLevelSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Year level name must be at least 2 characters.")
    .max(50, "Year level name must be 50 characters or fewer."),
  order: z.coerce
    .number()
    .int("Display order must be a whole number.")
    .min(1, "Display order must be at least 1.")
    .max(20, "Display order must be 20 or fewer."),
});

export const updateYearLevelSchema = z.object({
  id: z.string().uuid(),
  name: z
    .string()
    .trim()
    .min(2, "Year level name must be at least 2 characters.")
    .max(50, "Year level name must be 50 characters or fewer."),
  order: z.coerce
    .number()
    .int("Display order must be a whole number.")
    .min(1, "Display order must be at least 1.")
    .max(20, "Display order must be 20 or fewer."),
});

export type CreateYearLevelInput = z.infer<typeof createYearLevelSchema>;
export type UpdateYearLevelInput = z.infer<typeof updateYearLevelSchema>;
