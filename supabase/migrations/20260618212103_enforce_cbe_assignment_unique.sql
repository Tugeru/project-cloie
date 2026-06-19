-- Enforce 1-to-1 relationship between CourseBoundEvaluation and CourseAssignment
-- Asserts zero NULLs remain, then SET NOT NULL and creates UNIQUE index

DO $$
DECLARE
  null_count INTEGER;
BEGIN
  -- Check for any remaining NULL course_assignment_id
  SELECT COUNT(*) INTO null_count
  FROM course_bound_evaluations
  WHERE course_assignment_id IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce NOT NULL constraint: % course_bound_evaluations still have NULL course_assignment_id. Run backfill migration first.', null_count;
  END IF;
  
  -- Delete duplicate CBEs keeping the oldest (by created_at)
  DELETE FROM course_bound_evaluations cbe1
  USING course_bound_evaluations cbe2
  WHERE cbe1.course_assignment_id = cbe2.course_assignment_id
    AND cbe1.created_at > cbe2.created_at
    AND cbe1.course_assignment_id IS NOT NULL;
  
  -- Set NOT NULL
  ALTER TABLE course_bound_evaluations 
  ALTER COLUMN course_assignment_id SET NOT NULL;
  
  -- Create unique index for 1-to-1 relationship
  CREATE UNIQUE INDEX IF NOT EXISTS course_bound_evaluations_course_assignment_id_key 
  ON course_bound_evaluations(course_assignment_id);
  
  RAISE NOTICE 'Successfully enforced NOT NULL + UNIQUE constraint on course_assignment_id';
END $$;
