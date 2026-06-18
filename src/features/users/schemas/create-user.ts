import { SystemRole } from "@prisma/client";
import { z } from "zod";

export const createUserBySecretarySchema = z.object({
  first_name: z.string().trim().min(1, "First name is required.").max(100),
  last_name: z.string().trim().min(1, "Last name is required.").max(100),
  email: z
    .string()
    .email("Enter a valid email address.")
    .transform((v) => v.toLowerCase()),
  role: z.nativeEnum(SystemRole),
  program_ids: z.array(z.string().uuid()).optional(),
  program_id: z.string().uuid().optional(),
  major_id: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().uuid().optional()
  ),
});

export type CreateUserBySecretaryInput = z.infer<typeof createUserBySecretarySchema>;
