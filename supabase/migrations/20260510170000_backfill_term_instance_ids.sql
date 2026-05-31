-- Migration: Backfill term_instance_id from legacy academic_year/semester/term data
-- Phase 9: Populate FKs before dropping legacy columns
-- This is idempotent - safe to run multiple times

-- =============================================================================
-- CourseBoundEvaluation: Backfill term_instance_id
-- =============================================================================

-- Log what we're about to update
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM course_bound_evaluations
    WHERE term_instance_id IS NULL
      AND academic_year IS NOT NULL
      AND semester IS NOT NULL;
    
    RAISE NOTICE 'CourseBoundEvaluation: % rows need term_instance_id backfill', v_count;
END $$;

-- Perform the backfill by joining on academic_year + semester + term
UPDATE course_bound_evaluations cbe
SET term_instance_id = ti.id
FROM academic_term_instances ti
JOIN school_years sy ON ti.school_year_id = sy.id
WHERE cbe.term_instance_id IS NULL
  AND cbe.academic_year IS NOT NULL
  AND cbe.semester IS NOT NULL
  AND sy.code = cbe.academic_year
  AND ti.semester::text = cbe.semester::text
  AND (
    (cbe.term IS NULL AND ti.term IS NULL)
    OR (cbe.term::text = ti.term::text)
  );

-- Log results
DO $$
DECLARE
    v_remaining INT;
BEGIN
    SELECT COUNT(*) INTO v_remaining
    FROM course_bound_evaluations
    WHERE term_instance_id IS NULL
      AND academic_year IS NOT NULL;
    
    IF v_remaining > 0 THEN
        RAISE WARNING 'CourseBoundEvaluation: % rows still have NULL term_instance_id after backfill', v_remaining;
    ELSE
        RAISE NOTICE 'CourseBoundEvaluation: All rows successfully backfilled';
    END IF;
END $$;

-- =============================================================================
-- CentralDeployment: Backfill term_instance_id
-- =============================================================================

DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM central_deployments
    WHERE term_instance_id IS NULL
      AND academic_year IS NOT NULL
      AND semester IS NOT NULL;
    
    RAISE NOTICE 'CentralDeployment: % rows need term_instance_id backfill', v_count;
END $$;

-- Note: CentralDeployment only has semester, not term
-- We map to the first term_instance matching the school_year and semester
UPDATE central_deployments cd
SET term_instance_id = ti.id
FROM (
    SELECT DISTINCT ON (sy.code, ti.semester)
        sy.code as school_year_code,
        ti.semester,
        ti.id as term_instance_id
    FROM academic_term_instances ti
    JOIN school_years sy ON ti.school_year_id = sy.id
    ORDER BY sy.code, ti.semester, ti.term NULLS FIRST
) ti
WHERE cd.term_instance_id IS NULL
  AND cd.academic_year IS NOT NULL
  AND cd.semester IS NOT NULL
  AND ti.school_year_code = cd.academic_year
  AND ti.semester::text = cd.semester::text;

-- Log results
DO $$
DECLARE
    v_remaining INT;
BEGIN
    SELECT COUNT(*) INTO v_remaining
    FROM central_deployments
    WHERE term_instance_id IS NULL
      AND academic_year IS NOT NULL;
    
    IF v_remaining > 0 THEN
        RAISE WARNING 'CentralDeployment: % rows still have NULL term_instance_id after backfill', v_remaining;
    ELSE
        RAISE NOTICE 'CentralDeployment: All rows successfully backfilled';
    END IF;
END $$;

-- =============================================================================
-- Verification Summary
-- =============================================================================

DO $$
DECLARE
    v_cbe_total INT;
    v_cbe_with_fk INT;
    v_cd_total INT;
    v_cd_with_fk INT;
BEGIN
    SELECT COUNT(*), COUNT(term_instance_id)
    INTO v_cbe_total, v_cbe_with_fk
    FROM course_bound_evaluations;
    
    SELECT COUNT(*), COUNT(term_instance_id)
    INTO v_cd_total, v_cd_with_fk
    FROM central_deployments;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'BACKFILL SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CourseBoundEvaluation: %/% have term_instance_id', v_cbe_with_fk, v_cbe_total;
    RAISE NOTICE 'CentralDeployment: %/% have term_instance_id', v_cd_with_fk, v_cd_total;
    RAISE NOTICE '========================================';
END $$;
