import { z } from "zod";

export const studentProfileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  program_id: z.string().uuid("Please select a valid Program"),
  major_id: z.string().uuid().optional().nullable().or(z.literal("")),
  year_level_id: z.string().uuid("Please select a valid Year Level"),
  student_id_number: z.string().min(5, "Student ID must be at least 5 characters"),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
