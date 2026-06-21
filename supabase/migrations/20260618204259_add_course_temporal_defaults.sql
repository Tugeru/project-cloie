-- AlterTable: add temporal default columns if not already present
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "default_semester" "academic_semester";
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "default_term" "academic_term";
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "default_year_level" "year_level";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "courses_default_semester_default_term_idx" ON "courses"("default_semester", "default_term");
