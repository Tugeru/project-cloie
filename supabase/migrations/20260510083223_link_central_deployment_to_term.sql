-- AlterTable
ALTER TABLE "central_deployments" ADD COLUMN     "term" "academic_term",
ADD COLUMN     "term_instance_id" UUID;

-- AlterTable
ALTER TABLE "course_bound_evaluations" ADD COLUMN     "course_assignment_id" UUID,
ADD COLUMN     "term_instance_id" UUID;

-- AlterTable
ALTER TABLE "faculty_program_affiliations" ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false;

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

-- CreateIndex
CREATE INDEX "course_assignments_term_instance_id_course_id_faculty_id_pr_idx" ON "course_assignments"("term_instance_id", "course_id", "faculty_id", "program_id", "year_level", "section");

-- CreateIndex
CREATE INDEX "course_assignments_term_instance_id_faculty_id_idx" ON "course_assignments"("term_instance_id", "faculty_id");

-- CreateIndex
CREATE INDEX "course_assignments_term_instance_id_course_id_idx" ON "course_assignments"("term_instance_id", "course_id");

-- CreateIndex
CREATE INDEX "course_assignments_is_active_idx" ON "course_assignments"("is_active");

-- CreateIndex
CREATE INDEX "central_deployments_term_instance_id_idx" ON "central_deployments"("term_instance_id");

-- CreateIndex
CREATE INDEX "course_bound_evaluations_term_instance_id_idx" ON "course_bound_evaluations"("term_instance_id");

-- CreateIndex
CREATE INDEX "course_bound_evaluations_course_assignment_id_idx" ON "course_bound_evaluations"("course_assignment_id");

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_term_instance_id_fkey" FOREIGN KEY ("term_instance_id") REFERENCES "academic_term_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_assignments" ADD CONSTRAINT "course_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_term_instance_id_fkey" FOREIGN KEY ("term_instance_id") REFERENCES "academic_term_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_course_assignment_id_fkey" FOREIGN KEY ("course_assignment_id") REFERENCES "course_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "central_deployments" ADD CONSTRAINT "central_deployments_term_instance_id_fkey" FOREIGN KEY ("term_instance_id") REFERENCES "academic_term_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
