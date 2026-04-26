import { AcademicSemester } from "@prisma/client";
import { z } from "zod";

export const publishCentralDeploymentSchema = z
  .object({
    template_id: z.string().uuid(),
    deployment_name: z.string().trim().min(3, "Deployment name must be at least 3 characters."),
    target_stakeholder: z.enum(["STUDENT", "ALUMNI", "INDUSTRY_PARTNER"]),
    academic_year: z.string().min(1, "Academic year is required."),
    semester: z.nativeEnum(AcademicSemester),
    major_id: z.string().uuid().optional(),
    year_level_id: z.string().uuid().optional(),
    activation_at: z.coerce.date().optional(),
    deadline_at: z.coerce.date().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.target_stakeholder === "STUDENT" && !value.year_level_id) {
      ctx.addIssue({
        code: "custom",
        message: "Year level is required when publishing to students.",
        path: ["year_level_id"],
      });
    }
  });

export type PublishCentralDeploymentInput = z.infer<typeof publishCentralDeploymentSchema>;
