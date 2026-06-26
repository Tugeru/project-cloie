-- Restore drift between the partially-reverted remote DB and the corrected Prisma schema.
-- All statements are idempotent so the migration can be retried safely if a previous run
-- left partial state.

-- Deduplicate course_bound_evaluations on course_assignment_id before creating the unique index.
DELETE FROM "course_bound_evaluations"
WHERE "id" IN (
  SELECT "id"
  FROM (
    SELECT "id",
           ROW_NUMBER() OVER (
             PARTITION BY "course_assignment_id"
             ORDER BY "created_at" ASC, "id" ASC
           ) AS rn
    FROM "course_bound_evaluations"
    WHERE "course_assignment_id" IS NOT NULL
  ) ranked
  WHERE rn > 1
);

-- DropForeignKey
ALTER TABLE "course_bound_evaluations" DROP CONSTRAINT IF EXISTS "course_bound_evaluations_course_assignment_id_fkey";
ALTER TABLE "course_bound_evaluations" DROP CONSTRAINT IF EXISTS "course_bound_evaluations_deployed_by_fkey";

-- DropIndex
DROP INDEX IF EXISTS "course_bound_evaluations_course_assignment_id_idx";
DROP INDEX IF EXISTS "user_roles_user_id_role_key";

-- AlterTable
ALTER TABLE "course_assignments" ALTER COLUMN "section" SET NOT NULL;
ALTER TABLE "course_bound_evaluations" ALTER COLUMN "course_assignment_id" SET NOT NULL;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "default_semester" "academic_semester";
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "default_term" "academic_term";
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "default_year_level" "year_level";
ALTER TABLE "industry_partner_profiles" ADD COLUMN IF NOT EXISTS "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_user_id" UUID;

-- CreateTable
CREATE TABLE IF NOT EXISTS "alumni_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "program_id" UUID NOT NULL,
    "major_id" UUID,
    "verification_status" "verification_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "alumni_profiles_user_id_key" ON "alumni_profiles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "course_bound_evaluations_course_assignment_id_key" ON "course_bound_evaluations"("course_assignment_id");
CREATE INDEX IF NOT EXISTS "courses_default_semester_default_term_idx" ON "courses"("default_semester", "default_term");
CREATE UNIQUE INDEX IF NOT EXISTS "majors_id_program_id_key" ON "majors"("id", "program_id");
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_id_key" ON "user_roles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_key" ON "users"("auth_user_id");

-- AddForeignKey
ALTER TABLE "course_bound_evaluations" DROP CONSTRAINT IF EXISTS "course_bound_evaluations_deployed_by_fkey";
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_deployed_by_fkey" FOREIGN KEY ("deployed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_bound_evaluations" DROP CONSTRAINT IF EXISTS "course_bound_evaluations_course_assignment_id_fkey";
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_course_assignment_id_fkey" FOREIGN KEY ("course_assignment_id") REFERENCES "course_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "alumni_profiles" DROP CONSTRAINT IF EXISTS "alumni_profiles_user_id_fkey";
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "alumni_profiles" DROP CONSTRAINT IF EXISTS "alumni_profiles_program_id_fkey";
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "alumni_profiles" DROP CONSTRAINT IF EXISTS "alumni_profiles_major_id_program_id_fkey";
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_major_id_program_id_fkey" FOREIGN KEY ("major_id", "program_id") REFERENCES "majors"("id", "program_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'idx_course_bound_evaluations_deployed_by'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'course_bound_evaluations_deployed_by_idx'
  ) THEN
    ALTER INDEX "idx_course_bound_evaluations_deployed_by" RENAME TO "course_bound_evaluations_deployed_by_idx";
  END IF;
END $$;
