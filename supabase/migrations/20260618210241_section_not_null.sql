-- Precondition: ensure no NULL sections remain before enforcing NOT NULL
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM course_assignments
  WHERE section IS NULL;
  
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce NOT NULL on section: % course_assignments still have NULL section. Backfill section values first.', null_count;
  END IF;
END $$;

-- AlterTable: now safe to set NOT NULL
ALTER TABLE "course_assignments" ALTER COLUMN "section" SET NOT NULL;
