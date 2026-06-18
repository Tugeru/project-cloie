import { z } from "zod";
import { StudentSection, YearLevel } from "@prisma/client";

export const studentProfileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  program_id: z.string().uuid("Please select a valid Program"),
  major_id: z.string().uuid().optional().nullable().or(z.literal("")),
  year_level: z.nativeEnum(YearLevel, { error: "Please select a valid Year Level" }),
  student_id_number: z.string().min(5, "Student ID must be at least 5 characters"),
  section: z.nativeEnum(StudentSection, {
    error: "Please select a section",
  }),
});

/**
 * Schema for deferred-enrollment onboarding when no active academic term is configured.
 * year_level and section are not captured at this point — they will be provided during
 * enrollment once an active term becomes available.
 */
export const deferredStudentProfileSchema = z.object({
  first_name: z.string().min(2, "First name must be at least 2 characters"),
  last_name: z.string().min(2, "Last name must be at least 2 characters"),
  program_id: z.string().uuid("Please select a valid Program"),
  major_id: z.string().uuid().optional().nullable().or(z.literal("")),
  student_id_number: z.string().min(5, "Student ID must be at least 5 characters"),
  year_level: z.nativeEnum(YearLevel).optional().nullable().or(z.literal("")),
  section: z.nativeEnum(StudentSection).optional().nullable().or(z.literal("")),
});

export type StudentProfileInput = z.infer<typeof studentProfileSchema>;
export type DeferredStudentProfileInput = z.infer<typeof deferredStudentProfileSchema>;

/** Looser type for form state where fields start as empty string before selection. */
export type StudentProfileFormValues = Omit<StudentProfileInput, "section" | "year_level"> & {
  section: StudentSection | "";
  year_level: YearLevel | "";
};
