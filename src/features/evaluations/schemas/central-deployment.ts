import { AcademicSemester, AcademicTerm, YearLevel } from "@prisma/client";
import { z } from "zod";

/**
 * Phase 7: Updated schema supporting term_instance_id (preferred) or legacy academic_year/semester.
 */
export const publishCentralDeploymentSchema = z
  .object({
    template_id: z.string().uuid(),
    deployment_name: z.string().trim().min(3, "Deployment name must be at least 3 characters."),
    target_stakeholder: z.enum(["STUDENT", "ALUMNI", "INDUSTRY_PARTNER"]),
    // Phase 7: term_instance_id is the preferred way to specify academic period
    term_instance_id: z.string().uuid().optional(),
    // Legacy fields kept for backward compatibility during transition
    academic_year: z.string().optional(),
    semester: z.nativeEnum(AcademicSemester).optional(),
    term: z.nativeEnum(AcademicTerm).optional(),
    major_id: z.string().uuid().optional(),
    year_level: z.nativeEnum(YearLevel).optional(),
    activation_at: z.coerce.date().optional(),
    deadline_at: z.coerce.date().optional(),
    respondent_ids: z.array(z.string().uuid()).optional(),
  })
  .superRefine((value, ctx) => {
    // Either term_instance_id OR (academic_year + semester) must be provided
    const hasTermInstance = value.term_instance_id && value.term_instance_id.length > 0;
    const hasLegacyFields = value.academic_year && value.academic_year.length > 0 && value.semester;

    if (!hasTermInstance && !hasLegacyFields) {
      ctx.addIssue({
        code: "custom",
        message: "Either Term Instance or Academic Year + Semester is required.",
        path: ["term_instance_id"],
      });
    }

    if (value.target_stakeholder === "STUDENT" && !value.year_level) {
      ctx.addIssue({
        code: "custom",
        message: "Year level is required when publishing to students.",
        path: ["year_level"],
      });
    }
  });

export type PublishCentralDeploymentInput = z.infer<typeof publishCentralDeploymentSchema>;
