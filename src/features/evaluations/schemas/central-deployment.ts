import { z } from "zod";

export const publishCentralDeploymentSchema = z.object({
  template_id: z.string().uuid(),
  target_stakeholder: z.enum([
    "GRADUATING_STUDENT",
    "ALUMNI",
    "INDUSTRY_PARTNER",
  ]),
  academic_year: z.string().min(1, "Academic year is required."),
  semester: z.enum(["FIRST", "SECOND", "SUMMER"]),
  major_id: z.string().uuid().optional(),
  year_level_id: z.string().uuid().optional(),
  activation_at: z.coerce.date().optional(),
  deadline_at: z.coerce.date().optional(),
});

export type PublishCentralDeploymentInput = z.infer<
  typeof publishCentralDeploymentSchema
>;
