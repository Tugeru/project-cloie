import { AcademicSemester, AcademicTerm } from "@prisma/client";
import { z } from "zod";
import { assertValidSemesterTerm } from "@/lib/constants/academic-period";

/**
 * Zod schema for creating a Term Instance.
 */
export const createTermInstanceSchema = z.object({
  schoolYearId: z.string().uuid("Invalid school year ID"),
  semester: z.nativeEnum(AcademicSemester),
  term: z.nativeEnum(AcademicTerm).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).superRefine((data, ctx) => {
  const validation = assertValidSemesterTerm(data.semester, data.term ?? null);
  if (!validation.valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: validation.error,
      path: ["term"],
    });
  }
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export type CreateTermInstanceInput = z.infer<typeof createTermInstanceSchema>;

/**
 * Zod schema for updating a Term Instance.
 */
export const updateTermInstanceSchema = z.object({
  id: z.string().uuid("Invalid term instance ID"),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate < data.endDate;
    }
    return true;
  },
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

export type UpdateTermInstanceInput = z.infer<typeof updateTermInstanceSchema>;

/**
 * Zod schema for setting an active term instance.
 */
export const setActiveTermSchema = z.object({
  termInstanceId: z.string().uuid("Invalid term instance ID"),
});

export type SetActiveTermInput = z.infer<typeof setActiveTermSchema>;

/**
 * Zod schema for deleting a Term Instance.
 */
export const deleteTermInstanceSchema = z.object({
  id: z.string().uuid("Invalid term instance ID"),
});

export type DeleteTermInstanceInput = z.infer<typeof deleteTermInstanceSchema>;
