-- Backfill course_assignment_id for existing course_bound_evaluations
-- Matches CBE to CourseAssignment on [term_instance_id, course_id, faculty_id, section]
-- Uses IS NOT DISTINCT FROM for nullable section comparison

DO $$
DECLARE
  backfilled_count INTEGER;
BEGIN
  -- Idempotent backfill
  UPDATE course_bound_evaluations cbe
  SET course_assignment_id = ca.id
  FROM course_assignments ca
  WHERE ca.term_instance_id = cbe.term_instance_id
    AND ca.course_id = cbe.course_id
    AND ca.faculty_id = cbe.faculty_id
    AND (ca.section IS NOT DISTINCT FROM cbe.section)
    AND cbe.course_assignment_id IS NULL;
  
  GET DIAGNOSTICS backfilled_count = ROW_COUNT;
  
  RAISE NOTICE 'Backfilled % course_bound_evaluations with course_assignment_id', backfilled_count;
END $$;
