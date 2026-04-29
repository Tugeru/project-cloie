-- Migration: Add student_section enum, section columns, and NULLS NOT DISTINCT unique index
-- for course_bound_evaluations and student_academic_profiles.
--
-- Background: Prisma's @@unique does not emit NULLS NOT DISTINCT, so two evaluations
-- with section = NULL for the same (course, faculty, year, semester, term) would not
-- collide under the standard index. Postgres 15+ (this project runs Postgres 17) supports
-- NULLS NOT DISTINCT to fix this.

BEGIN;

-- 1. Create the student_section enum (idempotent)
DO $$ BEGIN
  CREATE TYPE "student_section" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add section column to student_academic_profiles (idempotent)
ALTER TABLE "student_academic_profiles"
  ADD COLUMN IF NOT EXISTS "section" "student_section";

-- 3. Add section column to course_bound_evaluations (idempotent)
ALTER TABLE "course_bound_evaluations"
  ADD COLUMN IF NOT EXISTS "section" "student_section";

-- 4. Drop old unique constraint (pre-section, if it still exists)
DROP INDEX IF EXISTS "course_bound_evaluations_course_id_academic_year_semester_term_key";

-- 5. Drop the standard Prisma-generated unique index (without NULLS NOT DISTINCT)
DROP INDEX IF EXISTS "course_bound_evaluations_course_id_faculty_id_academic_year_semester_term_section_key";

-- 6. Recreate as NULLS NOT DISTINCT so that NULL section values are treated as equal
--    (i.e., only one evaluation per faculty/course/year/semester/term with no section)
CREATE UNIQUE INDEX "course_bound_evaluations_course_id_faculty_id_academic_year_semester_term_section_key"
  ON "course_bound_evaluations"("course_id", "faculty_id", "academic_year", "semester", "term", "section")
  NULLS NOT DISTINCT;

COMMIT;
