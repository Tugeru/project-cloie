BEGIN;

DO $$
BEGIN
  CREATE TYPE "SystemRole" AS ENUM ('ADMIN', 'DEAN', 'PROGRAM_HEAD', 'FACULTY', 'STUDENT', 'ALUMNI', 'INDUSTRY_PARTNER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "academic_semester" AS ENUM ('1ST', '2ND', 'SUMMER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "academic_term" AS ENUM ('FIRST_TERM', 'SECOND_TERM');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "InviteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "major_id" UUID;

ALTER TABLE "student_academic_profiles"
  ADD COLUMN IF NOT EXISTS "is_graduating" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "course_bound_evaluations_course_id_academic_year_semester_term_";

ALTER TABLE "sections" RENAME COLUMN "semester" TO "semester_legacy";
ALTER TABLE "sections" ADD COLUMN "semester" "academic_semester";
UPDATE "sections"
SET "semester" = CASE
  WHEN UPPER(COALESCE("semester_legacy", '')) IN ('1ST', '1ST SEMESTER', 'FIRST', 'FIRST SEMESTER') THEN '1ST'::"academic_semester"
  WHEN UPPER(COALESCE("semester_legacy", '')) IN ('2ND', '2ND SEMESTER', 'SECOND', 'SECOND SEMESTER') THEN '2ND'::"academic_semester"
  ELSE 'SUMMER'::"academic_semester"
END;
ALTER TABLE "sections" ALTER COLUMN "semester" SET NOT NULL;
ALTER TABLE "sections" DROP COLUMN "semester_legacy";

ALTER TABLE "central_deployments" RENAME COLUMN "semester" TO "semester_legacy";
ALTER TABLE "central_deployments" ADD COLUMN "semester" "academic_semester";
UPDATE "central_deployments"
SET "semester" = CASE
  WHEN UPPER(COALESCE("semester_legacy", '')) IN ('1ST', '1ST SEMESTER', 'FIRST', 'FIRST SEMESTER') THEN '1ST'::"academic_semester"
  WHEN UPPER(COALESCE("semester_legacy", '')) IN ('2ND', '2ND SEMESTER', 'SECOND', 'SECOND SEMESTER') THEN '2ND'::"academic_semester"
  ELSE 'SUMMER'::"academic_semester"
END;
ALTER TABLE "central_deployments" ALTER COLUMN "semester" SET NOT NULL;
ALTER TABLE "central_deployments" DROP COLUMN "semester_legacy";

ALTER TABLE "course_bound_evaluations" RENAME COLUMN "semester" TO "semester_legacy";
ALTER TABLE "course_bound_evaluations" RENAME COLUMN "term" TO "term_legacy";
ALTER TABLE "course_bound_evaluations" ADD COLUMN "semester" "academic_semester";
ALTER TABLE "course_bound_evaluations" ADD COLUMN "term" "academic_term";
UPDATE "course_bound_evaluations"
SET
  "semester" = CASE
    WHEN UPPER(COALESCE("semester_legacy", '')) IN ('1ST', '1ST SEMESTER', 'FIRST', 'FIRST SEMESTER') THEN '1ST'::"academic_semester"
    WHEN UPPER(COALESCE("semester_legacy", '')) IN ('2ND', '2ND SEMESTER', 'SECOND', 'SECOND SEMESTER') THEN '2ND'::"academic_semester"
    ELSE 'SUMMER'::"academic_semester"
  END,
  "term" = CASE
    WHEN UPPER(COALESCE("term_legacy", '')) IN ('FIRST_TERM', '1ST_TERM', 'PRELIM', 'MIDTERM', '1ST TERM', 'FIRST TERM') THEN 'FIRST_TERM'::"academic_term"
    ELSE 'SECOND_TERM'::"academic_term"
  END;
ALTER TABLE "course_bound_evaluations" ALTER COLUMN "semester" SET NOT NULL;
ALTER TABLE "course_bound_evaluations" ALTER COLUMN "term" SET NOT NULL;
ALTER TABLE "course_bound_evaluations" DROP COLUMN "semester_legacy";
ALTER TABLE "course_bound_evaluations" DROP COLUMN "term_legacy";

ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_role_id_fkey";
ALTER TABLE "user_roles" ADD COLUMN IF NOT EXISTS "id" UUID;
UPDATE "user_roles" SET "id" = gen_random_uuid() WHERE "id" IS NULL;
ALTER TABLE "user_roles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "user_roles" ADD COLUMN IF NOT EXISTS "role" "SystemRole";
UPDATE "user_roles" AS ur
SET "role" = CASE r."name"
  WHEN 'ADMIN' THEN 'ADMIN'::"SystemRole"
  WHEN 'DEAN' THEN 'DEAN'::"SystemRole"
  WHEN 'PROGRAM_HEAD' THEN 'PROGRAM_HEAD'::"SystemRole"
  WHEN 'FACULTY' THEN 'FACULTY'::"SystemRole"
  WHEN 'STUDENT' THEN 'STUDENT'::"SystemRole"
  WHEN 'GRADUATING_STUDENT' THEN 'STUDENT'::"SystemRole"
  WHEN 'ALUMNI' THEN 'ALUMNI'::"SystemRole"
  WHEN 'INDUSTRY_PARTNER' THEN 'INDUSTRY_PARTNER'::"SystemRole"
  ELSE NULL
END
FROM "roles" AS r
WHERE ur."role_id" = r."id"
  AND ur."role" IS NULL;

DELETE FROM "user_roles" AS a
USING "user_roles" AS b
WHERE a.ctid < b.ctid
  AND a."user_id" = b."user_id"
  AND a."role" = b."role";

ALTER TABLE "user_roles" ALTER COLUMN "id" SET NOT NULL;
ALTER TABLE "user_roles" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "user_roles_pkey";
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");
DROP INDEX IF EXISTS "user_roles_user_id_role_id_key";
ALTER TABLE "user_roles" DROP COLUMN IF EXISTS "role_id";

DROP TABLE IF EXISTS "roles";

CREATE TABLE IF NOT EXISTS "external_stakeholder_invites" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "role" "SystemRole" NOT NULL,
  "program_id" UUID,
  "invited_by" UUID,
  "invitee_name" TEXT,
  "company_name" TEXT,
  "note" TEXT,
  "status" "InviteStatus" NOT NULL DEFAULT 'DRAFT',
  "sent_at" TIMESTAMP(3),
  "accepted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "external_stakeholder_invites_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "majors_program_id_name_key" ON "majors"("program_id", "name");
CREATE UNIQUE INDEX IF NOT EXISTS "plos_program_id_code_key" ON "plos"("program_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "gos_program_id_code_key" ON "gos"("program_id", "code");
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");
CREATE UNIQUE INDEX IF NOT EXISTS "course_bound_evaluations_course_id_academic_year_semester_t_key" ON "course_bound_evaluations"("course_id", "academic_year", "semester", "term");
CREATE INDEX IF NOT EXISTS "external_stakeholder_invites_role_status_idx" ON "external_stakeholder_invites"("role", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "external_stakeholder_invites_email_role_program_id_key" ON "external_stakeholder_invites"("email", "role", "program_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'courses_major_id_fkey'
  ) THEN
    ALTER TABLE "courses"
      ADD CONSTRAINT "courses_major_id_fkey"
      FOREIGN KEY ("major_id") REFERENCES "majors"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'external_stakeholder_invites_invited_by_fkey'
  ) THEN
    ALTER TABLE "external_stakeholder_invites"
      ADD CONSTRAINT "external_stakeholder_invites_invited_by_fkey"
      FOREIGN KEY ("invited_by") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'external_stakeholder_invites_program_id_fkey'
  ) THEN
    ALTER TABLE "external_stakeholder_invites"
      ADD CONSTRAINT "external_stakeholder_invites_program_id_fkey"
      FOREIGN KEY ("program_id") REFERENCES "programs"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER INDEX IF EXISTS "course_bound_evaluation_targets_course_bound_evaluation_id_prog"
  RENAME TO "course_bound_evaluation_targets_course_bound_evaluation_id__key";

COMMIT;
