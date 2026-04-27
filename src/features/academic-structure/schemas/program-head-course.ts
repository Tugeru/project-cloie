import { CourseScope } from "@prisma/client";
import { z } from "zod";

const optionalUuidField = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.string().uuid().optional()
);

const optionalTextField = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().max(1000).optional());

const programHeadCourseFields = {
  code: z
    .string()
    .trim()
    .min(2, "Course code must be at least 2 characters.")
    .max(20, "Course code must be 20 characters or fewer.")
    .transform((value) => value.toUpperCase()),
  title: z
    .string()
    .trim()
    .min(3, "Course title must be at least 3 characters.")
    .max(200, "Course title must be 200 characters or fewer."),
  description: optionalTextField,
  course_scope: z.literal(CourseScope.PROGRAM_SPECIFIC, {
    message: "Program Heads can only create program-specific courses.",
  }),
  major_id: optionalUuidField,
};

export const createProgramHeadCourseSchema = z.object(programHeadCourseFields);

export const updateProgramHeadCourseSchema = z.object({
  id: z.string().uuid(),
  ...programHeadCourseFields,
});

export type CreateProgramHeadCourseInput = z.infer<typeof createProgramHeadCourseSchema>;
export type UpdateProgramHeadCourseInput = z.infer<typeof updateProgramHeadCourseSchema>;
