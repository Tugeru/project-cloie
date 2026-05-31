import { z } from "zod";
import { EnrollmentSource, YearLevel, StudentSection } from "@prisma/client";

/**
 * Base schema for enrollment data.
 */
export const enrollmentBaseSchema = z.object({
  studentUserId: z.string().uuid(),
  termInstanceId: z.string().uuid(),
  programId: z.string().uuid(),
  majorId: z.string().uuid().nullable().optional(),
  yearLevel: z.nativeEnum(YearLevel),
  section: z.nativeEnum(StudentSection).nullable().optional(),
});

/**
 * Schema for upserting an enrollment (onboarding flow).
 */
export const upsertEnrollmentSchema = enrollmentBaseSchema.extend({
  source: z.literal(EnrollmentSource.ONBOARDING),
});

/**
 * Schema for admin upserting an enrollment (any term, any source).
 */
export const adminUpsertEnrollmentSchema = enrollmentBaseSchema.extend({
  source: z.nativeEnum(EnrollmentSource),
});

/**
 * Schema for deactivating an enrollment.
 */
export const deactivateEnrollmentSchema = z.object({
  enrollmentId: z.string().uuid(),
});

/**
 * TypeScript types derived from schemas.
 */
export type UpsertEnrollmentInput = z.infer<typeof upsertEnrollmentSchema>;
export type AdminUpsertEnrollmentInput = z.infer<typeof adminUpsertEnrollmentSchema>;
export type DeactivateEnrollmentInput = z.infer<typeof deactivateEnrollmentSchema>;
