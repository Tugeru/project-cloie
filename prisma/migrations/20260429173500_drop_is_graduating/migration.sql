-- DropIsGraduating
-- Remove the is_graduating column from student_academic_profiles.
-- Graduating students are now identified by year level (e.g., 4th year) instead.

ALTER TABLE "student_academic_profiles"
  DROP COLUMN IF EXISTS "is_graduating";
