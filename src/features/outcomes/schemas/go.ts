import { z } from "zod";

const goFields = {
  code: z
    .string()
    .trim()
    .min(1, "GO code is required.")
    .max(20, "GO code must be 20 characters or fewer.")
    .transform((value) => value.toUpperCase()),
  description: z
    .string()
    .trim()
    .min(3, "Description must be at least 3 characters.")
    .max(1000, "Description must be 1000 characters or fewer."),
  order: z.coerce
    .number()
    .int("Order must be a whole number.")
    .min(0, "Order must be 0 or greater."),
};

export const createGOSchema = z.object(goFields);

export const updateGOSchema = z.object({
  id: z.string().uuid("Invalid GO ID."),
  ...goFields,
});

export type CreateGOInput = z.infer<typeof createGOSchema>;
export type UpdateGOInput = z.infer<typeof updateGOSchema>;
