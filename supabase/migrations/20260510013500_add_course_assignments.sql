-- Phase 3: Course Assignments
-- Creates the course_assignments table for faculty-to-course assignments per term

-- CreateTable
CREATE TABLE "course_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "term_instance_id" UUID NOT NULL,
    "faculty_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "year_level" "year_level" NOT NULL,
    "section" "student_section",
    "assigned_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_assignments_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one assignment per faculty/course/program/year/section per term
-- NULLS NOT DISTINCT for section column
CREATE UNIQUE INDEX "course_assignments_unique_key" 
  ON "course_assignments"("term_instance_id", "course_id", "faculty_id", "program_id", "year_level", "section") 
  NULLS NOT DISTINCT;

-- Index for faculty lookups
CREATE INDEX "course_assignments_faculty_idx" ON "course_assignments"("term_instance_id", "faculty_id");

-- Index for course lookups
CREATE INDEX "course_assignments_course_idx" ON "course_assignments"("term_instance_id", "course_id");

-- Index for filtering active assignments
CREATE INDEX "course_assignments_is_active_idx" ON "course_assignments"("is_active");

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_term_instance_id_fkey" 
  FOREIGN KEY ("term_instance_id") REFERENCES "academic_term_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_faculty_id_fkey" 
  FOREIGN KEY ("faculty_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_course_id_fkey" 
  FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_program_id_fkey" 
  FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_assigned_by_fkey" 
  FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
