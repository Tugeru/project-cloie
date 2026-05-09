-- CreateEnum
CREATE TYPE "enrollment_source" AS ENUM ('ONBOARDING', 'ROLLOVER', 'ADMIN');

-- CreateTable
CREATE TABLE "school_years" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "start_date" DATE,
    "end_date" DATE,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "archived_by" UUID,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_term_instances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_year_id" UUID NOT NULL,
    "semester" "academic_semester" NOT NULL,
    "term" "academic_term",
    "start_date" DATE,
    "end_date" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "academic_term_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_enrollments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_user_id" UUID NOT NULL,
    "term_instance_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "major_id" UUID,
    "year_level" "year_level" NOT NULL,
    "section" "student_section",
    "source" "enrollment_source" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_years_code_key" ON "school_years"("code");

-- CreateIndex
CREATE INDEX "academic_term_instances_school_year_id_semester_term_idx" ON "academic_term_instances"("school_year_id", "semester", "term");

-- CreateIndex
CREATE INDEX "academic_term_instances_is_active_idx" ON "academic_term_instances"("is_active");

-- CreateIndex
CREATE INDEX "student_enrollments_term_instance_id_program_id_year_level__idx" ON "student_enrollments"("term_instance_id", "program_id", "year_level", "section");

-- CreateIndex
CREATE INDEX "student_enrollments_is_active_idx" ON "student_enrollments"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "student_enrollments_student_user_id_term_instance_id_key" ON "student_enrollments"("student_user_id", "term_instance_id");

-- AddForeignKey
ALTER TABLE "school_years" ADD CONSTRAINT "school_years_archived_by_fkey" FOREIGN KEY ("archived_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_term_instances" ADD CONSTRAINT "academic_term_instances_school_year_id_fkey" FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_user_id_fkey" FOREIGN KEY ("student_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_term_instance_id_fkey" FOREIGN KEY ("term_instance_id") REFERENCES "academic_term_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
