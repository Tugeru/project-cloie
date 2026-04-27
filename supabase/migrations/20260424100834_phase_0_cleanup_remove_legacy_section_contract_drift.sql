BEGIN;

DO $$
BEGIN
  CREATE TYPE "SystemRole" AS ENUM (
    'ADMIN',
    'DEAN',
    'PROGRAM_HEAD',
    'FACULTY',
    'STUDENT',
    'ALUMNI',
    'INDUSTRY_PARTNER'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "InviteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REVOKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "CourseScope" AS ENUM ('GENERAL_EDUCATION', 'PROGRAM_SPECIFIC');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "DeploymentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'CLOSED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "ResponseStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "DeploymentType" AS ENUM ('COURSE_BOUND', 'CENTRAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "TargetStakeholder" AS ENUM ('GRADUATING_STUDENT', 'ALUMNI', 'INDUSTRY_PARTNER');
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
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_roles'
      AND column_name = 'role_id'
  ) THEN
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
    ALTER TABLE "user_roles" DROP COLUMN IF EXISTS "role_id";
  END IF;
END $$;

DROP TABLE IF EXISTS "roles";

CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_user_id_role_key" ON "user_roles"("user_id", "role");

ALTER TABLE "courses"
  ADD COLUMN IF NOT EXISTS "major_id" UUID,
  ADD COLUMN IF NOT EXISTS "course_scope" "CourseScope";

UPDATE "courses" AS c
SET "course_scope" = CASE
  WHEN ct."name" ILIKE '%general%' OR ct."name" ILIKE '%gen ed%' OR ct."name" ILIKE '%ge%' THEN 'GENERAL_EDUCATION'::"CourseScope"
  ELSE 'PROGRAM_SPECIFIC'::"CourseScope"
END
FROM "course_types" AS ct
WHERE c."course_type_id" = ct."id"
  AND c."course_scope" IS NULL;

UPDATE "courses"
SET "course_scope" = 'PROGRAM_SPECIFIC'::"CourseScope"
WHERE "course_scope" IS NULL;

ALTER TABLE "courses"
  ALTER COLUMN "course_scope" SET DEFAULT 'PROGRAM_SPECIFIC'::"CourseScope",
  ALTER COLUMN "course_scope" SET NOT NULL;

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

ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_course_type_id_fkey";
ALTER TABLE "courses" DROP COLUMN IF EXISTS "course_type_id";
DROP TABLE IF EXISTS "course_types";

ALTER TABLE "student_academic_profiles"
  ADD COLUMN IF NOT EXISTS "is_graduating" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "student_academic_profiles" DROP CONSTRAINT IF EXISTS "student_academic_profiles_section_id_fkey";
ALTER TABLE "student_academic_profiles" DROP COLUMN IF EXISTS "section_id";

ALTER TABLE "course_bound_evaluation_targets" DROP CONSTRAINT IF EXISTS "course_bound_evaluation_targets_section_id_fkey";
DROP INDEX IF EXISTS "course_bound_evaluation_targets_course_bound_evaluation_id_program_id_year_level_id_section_id_key";
ALTER TABLE "course_bound_evaluation_targets" DROP COLUMN IF EXISTS "section_id";

WITH ranked_targets AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "course_bound_evaluation_id", "program_id", "year_level_id"
      ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
    ) AS "row_number"
  FROM "course_bound_evaluation_targets"
)
DELETE FROM "course_bound_evaluation_targets"
WHERE "id" IN (
  SELECT "id"
  FROM ranked_targets
  WHERE "row_number" > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_bound_evaluation_targets_course_bound_evaluation_id_program_id_year_level_id_key"
  ON "course_bound_evaluation_targets"("course_bound_evaluation_id", "program_id", "year_level_id");

ALTER TABLE "cilo_mappings" ADD COLUMN IF NOT EXISTS "go_id" UUID;
ALTER TABLE "cilo_mappings" DROP CONSTRAINT IF EXISTS "cilo_mappings_plo_id_fkey";
DELETE FROM "cilo_mappings" WHERE "go_id" IS NULL;
ALTER TABLE "cilo_mappings" DROP COLUMN IF EXISTS "plo_id";
ALTER TABLE "cilo_mappings" ALTER COLUMN "go_id" SET NOT NULL;
DROP TABLE IF EXISTS "plos";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'cilo_mappings_go_id_fkey'
  ) THEN
    ALTER TABLE "cilo_mappings"
      ADD CONSTRAINT "cilo_mappings_go_id_fkey"
      FOREIGN KEY ("go_id") REFERENCES "gos"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "instrument_templates"
  ADD COLUMN IF NOT EXISTS "program_id" UUID,
  ADD COLUMN IF NOT EXISTS "is_faculty_accessible" BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'instrument_templates_program_id_fkey'
  ) THEN
    ALTER TABLE "instrument_templates"
      ADD CONSTRAINT "instrument_templates_program_id_fkey"
      FOREIGN KEY ("program_id") REFERENCES "programs"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "central_deployments"
  ADD COLUMN IF NOT EXISTS "major_id" UUID,
  ADD COLUMN IF NOT EXISTS "year_level_id" UUID;

DO $$
DECLARE
  semester_udt text;
BEGIN
  SELECT udt_name
  INTO semester_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'central_deployments'
    AND column_name = 'semester';

  IF semester_udt IS NOT NULL AND semester_udt <> 'academic_semester' THEN
    ALTER TABLE "central_deployments" ADD COLUMN IF NOT EXISTS "semester_aligned" "academic_semester";
    UPDATE "central_deployments"
    SET "semester_aligned" = CASE
      WHEN UPPER(COALESCE("semester"::text, '')) IN ('1ST', '1ST SEMESTER', 'FIRST', 'FIRST SEMESTER') THEN '1ST'::"academic_semester"
      WHEN UPPER(COALESCE("semester"::text, '')) IN ('2ND', '2ND SEMESTER', 'SECOND', 'SECOND SEMESTER') THEN '2ND'::"academic_semester"
      ELSE 'SUMMER'::"academic_semester"
    END
    WHERE "semester_aligned" IS NULL;
    ALTER TABLE "central_deployments" DROP COLUMN "semester";
    ALTER TABLE "central_deployments" RENAME COLUMN "semester_aligned" TO "semester";
    ALTER TABLE "central_deployments" ALTER COLUMN "semester" SET NOT NULL;
  END IF;
END $$;

DO $$
DECLARE
  status_udt text;
BEGIN
  SELECT udt_name
  INTO status_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'central_deployments'
    AND column_name = 'status';

  IF status_udt IS NOT NULL AND status_udt <> 'DeploymentStatus' THEN
    ALTER TABLE "central_deployments" ADD COLUMN IF NOT EXISTS "status_aligned" "DeploymentStatus";
    UPDATE "central_deployments"
    SET "status_aligned" = CASE UPPER(COALESCE("status"::text, ''))
      WHEN 'SCHEDULED' THEN 'SCHEDULED'::"DeploymentStatus"
      WHEN 'ACTIVE' THEN 'ACTIVE'::"DeploymentStatus"
      WHEN 'CLOSED' THEN 'CLOSED'::"DeploymentStatus"
      WHEN 'ARCHIVED' THEN 'ARCHIVED'::"DeploymentStatus"
      ELSE 'DRAFT'::"DeploymentStatus"
    END
    WHERE "status_aligned" IS NULL;
    ALTER TABLE "central_deployments" DROP COLUMN "status";
    ALTER TABLE "central_deployments" RENAME COLUMN "status_aligned" TO "status";
    ALTER TABLE "central_deployments" ALTER COLUMN "status" SET NOT NULL;
  END IF;
END $$;

DO $$
DECLARE
  stakeholder_udt text;
BEGIN
  SELECT udt_name
  INTO stakeholder_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'central_deployments'
    AND column_name = 'target_stakeholder';

  IF stakeholder_udt IS NOT NULL AND stakeholder_udt <> 'TargetStakeholder' THEN
    ALTER TABLE "central_deployments" ADD COLUMN IF NOT EXISTS "target_stakeholder_aligned" "TargetStakeholder";
    UPDATE "central_deployments"
    SET "target_stakeholder_aligned" = CASE UPPER(COALESCE("target_stakeholder"::text, ''))
      WHEN 'ALUMNI' THEN 'ALUMNI'::"TargetStakeholder"
      WHEN 'INDUSTRY_PARTNER' THEN 'INDUSTRY_PARTNER'::"TargetStakeholder"
      ELSE 'GRADUATING_STUDENT'::"TargetStakeholder"
    END
    WHERE "target_stakeholder_aligned" IS NULL;
    ALTER TABLE "central_deployments" DROP COLUMN "target_stakeholder";
    ALTER TABLE "central_deployments" RENAME COLUMN "target_stakeholder_aligned" TO "target_stakeholder";
    ALTER TABLE "central_deployments" ALTER COLUMN "target_stakeholder" SET NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'central_deployments_major_id_fkey'
  ) THEN
    ALTER TABLE "central_deployments"
      ADD CONSTRAINT "central_deployments_major_id_fkey"
      FOREIGN KEY ("major_id") REFERENCES "majors"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'central_deployments_year_level_id_fkey'
  ) THEN
    ALTER TABLE "central_deployments"
      ADD CONSTRAINT "central_deployments_year_level_id_fkey"
      FOREIGN KEY ("year_level_id") REFERENCES "year_levels"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
DECLARE
  semester_udt text;
  term_udt text;
  status_udt text;
BEGIN
  SELECT udt_name
  INTO semester_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'course_bound_evaluations'
    AND column_name = 'semester';

  IF semester_udt IS NOT NULL AND semester_udt <> 'academic_semester' THEN
    ALTER TABLE "course_bound_evaluations" ADD COLUMN IF NOT EXISTS "semester_aligned" "academic_semester";
    UPDATE "course_bound_evaluations"
    SET "semester_aligned" = CASE
      WHEN UPPER(COALESCE("semester"::text, '')) IN ('1ST', '1ST SEMESTER', 'FIRST', 'FIRST SEMESTER') THEN '1ST'::"academic_semester"
      WHEN UPPER(COALESCE("semester"::text, '')) IN ('2ND', '2ND SEMESTER', 'SECOND', 'SECOND SEMESTER') THEN '2ND'::"academic_semester"
      ELSE 'SUMMER'::"academic_semester"
    END
    WHERE "semester_aligned" IS NULL;
    ALTER TABLE "course_bound_evaluations" DROP COLUMN "semester";
    ALTER TABLE "course_bound_evaluations" RENAME COLUMN "semester_aligned" TO "semester";
    ALTER TABLE "course_bound_evaluations" ALTER COLUMN "semester" SET NOT NULL;
  END IF;

  SELECT udt_name
  INTO term_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'course_bound_evaluations'
    AND column_name = 'term';

  IF term_udt IS NOT NULL AND term_udt <> 'academic_term' THEN
    ALTER TABLE "course_bound_evaluations" ADD COLUMN IF NOT EXISTS "term_aligned" "academic_term";
    UPDATE "course_bound_evaluations"
    SET "term_aligned" = CASE
      WHEN UPPER(COALESCE("term"::text, '')) IN ('FIRST_TERM', '1ST_TERM', 'PRELIM', 'MIDTERM', '1ST TERM', 'FIRST TERM') THEN 'FIRST_TERM'::"academic_term"
      ELSE 'SECOND_TERM'::"academic_term"
    END
    WHERE "term_aligned" IS NULL;
    ALTER TABLE "course_bound_evaluations" DROP COLUMN "term";
    ALTER TABLE "course_bound_evaluations" RENAME COLUMN "term_aligned" TO "term";
    ALTER TABLE "course_bound_evaluations" ALTER COLUMN "term" SET NOT NULL;
  END IF;

  SELECT udt_name
  INTO status_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'course_bound_evaluations'
    AND column_name = 'status';

  IF status_udt IS NOT NULL AND status_udt <> 'DeploymentStatus' THEN
    ALTER TABLE "course_bound_evaluations" ADD COLUMN IF NOT EXISTS "status_aligned" "DeploymentStatus";
    UPDATE "course_bound_evaluations"
    SET "status_aligned" = CASE UPPER(COALESCE("status"::text, ''))
      WHEN 'SCHEDULED' THEN 'SCHEDULED'::"DeploymentStatus"
      WHEN 'ACTIVE' THEN 'ACTIVE'::"DeploymentStatus"
      WHEN 'CLOSED' THEN 'CLOSED'::"DeploymentStatus"
      WHEN 'ARCHIVED' THEN 'ARCHIVED'::"DeploymentStatus"
      ELSE 'DRAFT'::"DeploymentStatus"
    END
    WHERE "status_aligned" IS NULL;
    ALTER TABLE "course_bound_evaluations" DROP COLUMN "status";
    ALTER TABLE "course_bound_evaluations" RENAME COLUMN "status_aligned" TO "status";
    ALTER TABLE "course_bound_evaluations" ALTER COLUMN "status" SET NOT NULL;
  END IF;
END $$;

WITH ranked_responses AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "assignment_id"
      ORDER BY
        CASE WHEN "status"::text = 'SUBMITTED' THEN 0 ELSE 1 END,
        "submitted_at" DESC NULLS LAST,
        "updated_at" DESC,
        "created_at" DESC,
        "id" DESC
    ) AS "row_number"
  FROM "responses"
)
DELETE FROM "responses"
WHERE "id" IN (
  SELECT "id"
  FROM ranked_responses
  WHERE "row_number" > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS "responses_assignment_id_key" ON "responses"("assignment_id");

DO $$
DECLARE
  deployment_udt text;
  status_udt text;
BEGIN
  SELECT udt_name
  INTO deployment_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'responses'
    AND column_name = 'deployment_type';

  IF deployment_udt IS NOT NULL AND deployment_udt <> 'DeploymentType' THEN
    ALTER TABLE "responses" ADD COLUMN IF NOT EXISTS "deployment_type_aligned" "DeploymentType";
    UPDATE "responses"
    SET "deployment_type_aligned" = CASE UPPER(COALESCE("deployment_type"::text, ''))
      WHEN 'CENTRAL' THEN 'CENTRAL'::"DeploymentType"
      ELSE 'COURSE_BOUND'::"DeploymentType"
    END
    WHERE "deployment_type_aligned" IS NULL;
    ALTER TABLE "responses" DROP COLUMN "deployment_type";
    ALTER TABLE "responses" RENAME COLUMN "deployment_type_aligned" TO "deployment_type";
    ALTER TABLE "responses" ALTER COLUMN "deployment_type" SET NOT NULL;
  END IF;

  SELECT udt_name
  INTO status_udt
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'responses'
    AND column_name = 'status';

  IF status_udt IS NOT NULL AND status_udt <> 'ResponseStatus' THEN
    ALTER TABLE "responses" ADD COLUMN IF NOT EXISTS "status_aligned" "ResponseStatus";
    UPDATE "responses"
    SET "status_aligned" = CASE UPPER(COALESCE("status"::text, ''))
      WHEN 'SUBMITTED' THEN 'SUBMITTED'::"ResponseStatus"
      ELSE 'IN_PROGRESS'::"ResponseStatus"
    END
    WHERE "status_aligned" IS NULL;
    ALTER TABLE "responses" DROP COLUMN "status";
    ALTER TABLE "responses" RENAME COLUMN "status_aligned" TO "status";
    ALTER TABLE "responses" ALTER COLUMN "status" SET NOT NULL;
  END IF;
END $$;

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

CREATE TABLE IF NOT EXISTS "industry_partner_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "company_name" TEXT NOT NULL,
  "position" TEXT,
  "program_id" UUID,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "industry_partner_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "faculty_program_affiliations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "faculty_id" UUID NOT NULL,
  "program_id" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "faculty_program_affiliations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "program_head_assignments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "program_head_id" UUID NOT NULL,
  "program_id" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "program_head_assignments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "industry_partner_profiles_user_id_key" ON "industry_partner_profiles"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "faculty_program_affiliations_faculty_id_program_id_key"
  ON "faculty_program_affiliations"("faculty_id", "program_id");
CREATE UNIQUE INDEX IF NOT EXISTS "program_head_assignments_program_head_id_program_id_key"
  ON "program_head_assignments"("program_head_id", "program_id");
CREATE UNIQUE INDEX IF NOT EXISTS "external_stakeholder_invites_email_role_program_id_key"
  ON "external_stakeholder_invites"("email", "role", "program_id");
CREATE INDEX IF NOT EXISTS "external_stakeholder_invites_role_status_idx"
  ON "external_stakeholder_invites"("role", "status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'industry_partner_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE "industry_partner_profiles"
      ADD CONSTRAINT "industry_partner_profiles_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'industry_partner_profiles_program_id_fkey'
  ) THEN
    ALTER TABLE "industry_partner_profiles"
      ADD CONSTRAINT "industry_partner_profiles_program_id_fkey"
      FOREIGN KEY ("program_id") REFERENCES "programs"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;

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

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'faculty_program_affiliations_faculty_id_fkey'
  ) THEN
    ALTER TABLE "faculty_program_affiliations"
      ADD CONSTRAINT "faculty_program_affiliations_faculty_id_fkey"
      FOREIGN KEY ("faculty_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'faculty_program_affiliations_program_id_fkey'
  ) THEN
    ALTER TABLE "faculty_program_affiliations"
      ADD CONSTRAINT "faculty_program_affiliations_program_id_fkey"
      FOREIGN KEY ("program_id") REFERENCES "programs"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'program_head_assignments_program_head_id_fkey'
  ) THEN
    ALTER TABLE "program_head_assignments"
      ADD CONSTRAINT "program_head_assignments_program_head_id_fkey"
      FOREIGN KEY ("program_head_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'program_head_assignments_program_id_fkey'
  ) THEN
    ALTER TABLE "program_head_assignments"
      ADD CONSTRAINT "program_head_assignments_program_id_fkey"
      FOREIGN KEY ("program_id") REFERENCES "programs"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DROP TABLE IF EXISTS "sections";

COMMIT;
