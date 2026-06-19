-- Add nullable deployed_by column to course_bound_evaluations
-- Tracks who deployed the evaluation (for on-behalf deployments)
ALTER TABLE course_bound_evaluations
ADD COLUMN deployed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add index for querying evaluations deployed by a user
CREATE INDEX idx_course_bound_evaluations_deployed_by 
ON course_bound_evaluations(deployed_by);

-- Add comment for documentation
COMMENT ON COLUMN course_bound_evaluations.deployed_by IS 
  'User ID of person who deployed the evaluation (may differ from faculty_id for on-behalf deployments)';
