-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "default_semester" "academic_semester",
ADD COLUMN     "default_term" "academic_term",
ADD COLUMN     "default_year_level" "year_level";

-- CreateIndex
CREATE INDEX "courses_default_semester_default_term_idx" ON "courses"("default_semester", "default_term");
