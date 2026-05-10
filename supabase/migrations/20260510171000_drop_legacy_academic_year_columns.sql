-- Migration: Drop legacy free-text columns after Phase 9 backfill
-- WARNING: This is DESTRUCTIVE - ensure backfill migration has been run first!

-- =============================================================================
-- Pre-check: Verify all rows have term_instance_id populated
-- =============================================================================

DO $$
DECLARE
    v_cbe_missing INT;
    v_cd_missing INT;
BEGIN
    SELECT COUNT(*) INTO v_cbe_missing
    FROM course_bound_evaluations
    WHERE term_instance_id IS NULL;
    
    SELECT COUNT(*) INTO v_cd_missing
    FROM central_deployments
    WHERE term_instance_id IS NULL;
    
    IF v_cbe_missing > 0 OR v_cd_missing > 0 THEN
        RAISE EXCEPTION 'Cannot drop legacy columns: % CourseBoundEvaluation and % CentralDeployment rows still have NULL term_instance_id. Run backfill migration first!', v_cbe_missing, v_cd_missing;
    END IF;
    
    RAISE NOTICE 'Pre-check passed: All rows have term_instance_id populated';
END $$;

-- =============================================================================
-- CourseBoundEvaluation: Drop legacy columns
-- =============================================================================

-- First drop dependent index
DROP INDEX IF EXISTS course_bound_evaluations_course_id_faculty_id_academic_year_semester_term_secti;

-- Drop legacy columns
ALTER TABLE course_bound_evaluations
    DROP COLUMN IF EXISTS academic_year,
    DROP COLUMN IF EXISTS semester,
    DROP COLUMN IF EXISTS term;

-- Make term_instance_id NOT NULL (it should already be populated)
ALTER TABLE course_bound_evaluations
    ALTER COLUMN term_instance_id SET NOT NULL;

-- Add new unique constraint (will be managed with NULLS NOT DISTINCT separately)
-- Note: The actual unique constraint uses NULLS NOT DISTINCT for section
-- This index is for query performance; the constraint is enforced via migration
CREATE INDEX IF NOT EXISTS idx_cbe_term_course_faculty_section
    ON course_bound_evaluations (term_instance_id, course_id, faculty_id, section);

-- =============================================================================
-- CentralDeployment: Drop legacy columns
-- =============================================================================

-- Drop legacy columns
ALTER TABLE central_deployments
    DROP COLUMN IF EXISTS academic_year,
    DROP COLUMN IF EXISTS semester;

-- Make term_instance_id NOT NULL (it should already be populated)
ALTER TABLE central_deployments
    ALTER COLUMN term_instance_id SET NOT NULL;

-- Note: We keep the 'term' column in CentralDeployment as it may be needed
-- for display purposes (it's an enum, not free-text)

-- =============================================================================
-- StudentAcademicProfile: Drop enrollment-related columns (now in StudentEnrollment)
-- =============================================================================

ALTER TABLE student_academic_profiles
    DROP COLUMN IF EXISTS academic_year,
    DROP COLUMN IF EXISTS year_level,
    DROP COLUMN IF EXISTS section;

-- =============================================================================
-- Verification
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'LEGACY COLUMN DROP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Dropped from CourseBoundEvaluation: academic_year, semester, term';
    RAISE NOTICE 'Dropped from CentralDeployment: academic_year, semester';
    RAISE NOTICE 'Dropped from StudentAcademicProfile: academic_year, year_level, section';
    RAISE NOTICE 'term_instance_id is now NOT NULL in both deployment tables';
    RAISE NOTICE '========================================';
END $$;
