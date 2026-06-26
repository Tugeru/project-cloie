-- Remove MAJOR_SPECIFIC from CourseScope enum
-- First check that no rows use MAJOR_SPECIFIC (fail if any exist)

DO $$
DECLARE
  major_specific_count INTEGER;
BEGIN
  -- Check for any rows using MAJOR_SPECIFIC
  SELECT COUNT(*) INTO major_specific_count
  FROM courses
  WHERE course_scope::text = 'MAJOR_SPECIFIC';
  
  IF major_specific_count > 0 THEN
    RAISE EXCEPTION 'Cannot remove MAJOR_SPECIFIC enum value: % courses still use it. Update these courses first.', major_specific_count;
  END IF;
  
  -- Safe to proceed with enum migration
  CREATE TYPE "CourseScope_new" AS ENUM ('GENERAL_EDUCATION', 'PROGRAM_SPECIFIC');
  ALTER TABLE "courses" ALTER COLUMN "course_scope" DROP DEFAULT;
  ALTER TABLE "courses" ALTER COLUMN "course_scope" TYPE "CourseScope_new" USING ("course_scope"::text::"CourseScope_new");
  ALTER TYPE "CourseScope" RENAME TO "CourseScope_old";
  ALTER TYPE "CourseScope_new" RENAME TO "CourseScope";
  DROP TYPE "CourseScope_old";
  ALTER TABLE "courses" ALTER COLUMN "course_scope" SET DEFAULT 'PROGRAM_SPECIFIC';
  
  RAISE NOTICE 'Successfully removed MAJOR_SPECIFIC from CourseScope enum';
END $$;
