import { AcademicSemester, AcademicTerm, CourseScope, YearLevel } from "@prisma/client";
import { z } from "zod";
import { assertValidSemesterTerm } from "@/lib/constants/academic-period";

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
  default_year_level: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.nativeEnum(YearLevel).optional()
  ),
  default_semester: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.nativeEnum(AcademicSemester).optional()
  ),
  default_term: z.preprocess(
    (value) => (value === "" || value == null || value === "null" ? null : value),
    z.nativeEnum(AcademicTerm).nullable().optional()
  ),
};

function validateSemesterTerm(
  data: { default_semester?: AcademicSemester; default_term?: AcademicTerm | null },
  context: z.RefinementCtx
) {
  if (data.default_semester !== undefined) {
    const result = assertValidSemesterTerm(data.default_semester, data.default_term ?? null);
    if (!result.valid) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: result.error,
        path: ["default_semester"],
      });
    }
  } else if (data.default_term !== undefined && data.default_term !== null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Semester must be set if term is set.",
      path: ["default_semester"],
    });
  }
}

/**
 * PH courses are always PROGRAM_SPECIFIC (scope locked, program_id injected server-side).
 * This refine mirrors the validateCourseRelationships pattern from course.ts.
 * major_id validity is already enforced by the optionalUuidField UUID preprocessor.
 * No additional cross-field validation is required for the PH submission path because
 * program_id is always present (injected server-side from the PH's assignment).
 */
function validateCourseRelationships(
  _data: { course_scope: CourseScope; major_id?: string | null },
  _context: z.RefinementCtx
) {
  // course_scope is locked to PROGRAM_SPECIFIC by the z.literal field.
  // program_id is injected server-side — always present for PH courses.
  // major_id uuid validity is handled upstream by optionalUuidField.
}

export const createProgramHeadCourseSchema = z
  .object(programHeadCourseFields)
  .superRefine(validateSemesterTerm)
  .superRefine(validateCourseRelationships);

export const updateProgramHeadCourseSchema = z
  .object({
    id: z.string().uuid(),
    ...programHeadCourseFields,
  })
  .superRefine(validateSemesterTerm)
  .superRefine(validateCourseRelationships);

export type CreateProgramHeadCourseInput = z.infer<typeof createProgramHeadCourseSchema>;
export type UpdateProgramHeadCourseInput = z.infer<typeof updateProgramHeadCourseSchema>;
