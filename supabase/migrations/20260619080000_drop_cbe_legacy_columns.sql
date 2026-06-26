-- ============================================================
-- Issue #45: Drop legacy redundant columns from course_bound_evaluations
-- ============================================================
-- These columns are redundant now that course_assignment_id is the source of truth (Issue #39)
-- All code has been updated to join through course_assignment instead
-- 
-- Dropped columns:
-- - course_id (use course_assignment.course_id)
-- - faculty_id (use course_assignment.faculty_id)
-- - program_id (use course_assignment.program_id)
-- - major_id (use course_assignment.course.major_id)
-- - section (use course_assignment.section)
--
-- Kept columns:
-- - term_instance_id (still needed for query scoping)
-- - course_assignment_id (source of truth, unique constraint from Issue #39)
-- - deployed_by (added in Issue #43 for on-behalf deployment)
-- ============================================================

-- Start transaction (Supabase will run this as migration)
BEGIN;

-- 1. Drop the redundant unique index on [term_instance_id, course_id, faculty_id, section]
-- This was added in Issue #39 as a temporary measure
DROP INDEX IF EXISTS idx_course_bound_evaluations_term_course_faculty_section;

-- 2. Drop foreign key constraints first (if they exist)
ALTER TABLE course_bound_evaluations
DROP CONSTRAINT IF EXISTS course_bound_evaluations_course_id_fkey,
DROP CONSTRAINT IF EXISTS course_bound_evaluations_faculty_id_fkey,
DROP CONSTRAINT IF EXISTS course_bound_evaluations_program_id_fkey,
DROP CONSTRAINT IF EXISTS course_bound_evaluations_major_id_fkey;

-- 3. Drop the redundant columns
ALTER TABLE course_bound_evaluations
DROP COLUMN IF EXISTS course_id,
DROP COLUMN IF EXISTS faculty_id,
DROP COLUMN IF EXISTS program_id,
DROP COLUMN IF EXISTS major_id,
DROP COLUMN IF EXISTS section;

-- 4. Add comment documenting the design decision
COMMENT ON COLUMN course_bound_evaluations.course_assignment_id IS 
  'Source of truth for class identity. All course/faculty/program/section info comes from this relation.';

COMMENT ON COLUMN course_bound_evaluations.term_instance_id IS 
  'Academic term scoping - kept for efficient list queries and filtering.';

COMMENT ON COLUMN course_bound_evaluations.deployed_by IS 
  'User who deployed this evaluation (for on-behalf deployment, Issue #43).';

-- Log success (before COMMIT, so notice fires within the transaction)
DO $$
BEGIN
  RAISE NOTICE 'Issue #45: Successfully dropped legacy CBE columns';
  RAISE NOTICE '  - course_id';
  RAISE NOTICE '  - faculty_id';
  RAISE NOTICE '  - program_id';
  RAISE NOTICE '  - major_id';
  RAISE NOTICE '  - section';
  RAISE NOTICE '  - idx_course_bound_evaluations_term_course_faculty_section';
END $$;

COMMIT;
