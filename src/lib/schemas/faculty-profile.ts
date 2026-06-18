import { z } from "zod";

export const facultyProfileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  program_id: z.string().uuid("Please select a valid Program"),
});

export type FacultyProfileInput = z.infer<typeof facultyProfileSchema>;
export type FacultyProfileFormValues = FacultyProfileInput;
