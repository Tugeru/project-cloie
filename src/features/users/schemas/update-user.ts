import { z } from "zod";

export const updateUserBySecretarySchema = z.object({
  id: z.string().uuid(),
  first_name: z
    .string()
    .trim()
    .min(1, "First name is required.")
    .max(100, "First name must be 100 characters or fewer."),
  last_name: z
    .string()
    .trim()
    .min(1, "Last name is required.")
    .max(100, "Last name must be 100 characters or fewer."),
});

export type UpdateUserBySecretaryInput = z.infer<typeof updateUserBySecretarySchema>;
