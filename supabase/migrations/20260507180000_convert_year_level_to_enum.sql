-- Convert YearLevel from entity to enum
-- This migration: (1) creates the enum, (2) adds new columns, (3) migrates data, (4) drops old structure

-- Step 1: Create the YearLevel enum type
CREATE TYPE "public"."year_level" AS ENUM ('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR');

-- Step 2: Add new year_level enum columns to affected tables
ALTER TABLE "public"."student_academic_profiles" ADD COLUMN "year_level" "public"."year_level";
ALTER TABLE "public"."course_bound_evaluation_targets" ADD COLUMN "year_level" "public"."year_level";
ALTER TABLE "public"."central_deployments" ADD COLUMN "year_level" "public"."year_level";

-- Step 3: Migrate data from old year_levels table to new enum columns
-- Map based on the name field in year_levels table
UPDATE "public"."student_academic_profiles" sap
SET "year_level" = (
  CASE yl.name
    WHEN '1st Year' THEN 'FIRST_YEAR'::"public"."year_level"
    WHEN '2nd Year' THEN 'SECOND_YEAR'::"public"."year_level"
    WHEN '3rd Year' THEN 'THIRD_YEAR'::"public"."year_level"
    WHEN '4th Year' THEN 'FOURTH_YEAR'::"public"."year_level"
  END
)
FROM "public"."year_levels" yl
WHERE sap.year_level_id = yl.id;

UPDATE "public"."course_bound_evaluation_targets" cbt
SET "year_level" = (
  CASE yl.name
    WHEN '1st Year' THEN 'FIRST_YEAR'::"public"."year_level"
    WHEN '2nd Year' THEN 'SECOND_YEAR'::"public"."year_level"
    WHEN '3rd Year' THEN 'THIRD_YEAR'::"public"."year_level"
    WHEN '4th Year' THEN 'FOURTH_YEAR'::"public"."year_level"
  END
)
FROM "public"."year_levels" yl
WHERE cbt.year_level_id = yl.id;

UPDATE "public"."central_deployments" cd
SET "year_level" = (
  CASE yl.name
    WHEN '1st Year' THEN 'FIRST_YEAR'::"public"."year_level"
    WHEN '2nd Year' THEN 'SECOND_YEAR'::"public"."year_level"
    WHEN '3rd Year' THEN 'THIRD_YEAR'::"public"."year_level"
    WHEN '4th Year' THEN 'FOURTH_YEAR'::"public"."year_level"
  END
)
FROM "public"."year_levels" yl
WHERE cd.year_level_id = yl.id;

-- Step 4: Make year_level NOT NULL where it was required before
-- student_academic_profiles had required year_level_id
UPDATE "public"."student_academic_profiles" SET "year_level" = 'FIRST_YEAR'::"public"."year_level" WHERE "year_level" IS NULL;
ALTER TABLE "public"."student_academic_profiles" ALTER COLUMN "year_level" SET NOT NULL;

-- Step 5: Drop foreign key constraints
ALTER TABLE "public"."student_academic_profiles" DROP CONSTRAINT IF EXISTS "student_academic_profiles_year_level_id_fkey";
ALTER TABLE "public"."course_bound_evaluation_targets" DROP CONSTRAINT IF EXISTS "course_bound_evaluation_targets_year_level_id_fkey";
ALTER TABLE "public"."central_deployments" DROP CONSTRAINT IF EXISTS "central_deployments_year_level_id_fkey";

-- Step 6: Drop old year_level_id columns
ALTER TABLE "public"."student_academic_profiles" DROP COLUMN IF EXISTS "year_level_id";
ALTER TABLE "public"."course_bound_evaluation_targets" DROP COLUMN IF EXISTS "year_level_id";
ALTER TABLE "public"."central_deployments" DROP COLUMN IF EXISTS "year_level_id";

-- Step 7: Drop unique constraint that included year_level_id and create new one
ALTER TABLE "public"."course_bound_evaluation_targets" 
  DROP CONSTRAINT IF EXISTS "course_bound_evaluation_targets_course_bound_evaluation_id_program_key";

-- Note: The old unique index with year_level_id needs to be dropped
DROP INDEX IF EXISTS "course_bound_evaluation_targets_course_bound_evaluation_id_program_id_year_level_id_key";

-- Create new unique constraint with year_level enum
ALTER TABLE "public"."course_bound_evaluation_targets" 
  ADD CONSTRAINT "course_bound_evaluation_targets_course_bound_evaluation_id_progra_key" 
  UNIQUE ("course_bound_evaluation_id", "program_id", "year_level");

-- Step 8: Drop the year_levels table (after data migration)
DROP TABLE IF EXISTS "public"."year_levels";

-- Step 9: Clean up any orphaned references in Prisma's migration tracking (if needed)
-- This ensures Prisma knows about the new enum type
