-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "majors" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "program_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "majors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,

    CONSTRAINT "course_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "program_id" UUID,
    "course_type_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "year_levels" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "year_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "year_level_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "academic_year" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_academic_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "major_id" UUID,
    "year_level_id" UUID NOT NULL,
    "section_id" UUID,
    "student_id_number" TEXT,
    "academic_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_academic_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "program_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "program_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cilos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "description" TEXT NOT NULL,
    "course_id" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "academic_term" TEXT NOT NULL,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cilos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cilo_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cilo_id" UUID NOT NULL,
    "plo_id" UUID,
    "go_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cilo_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instrument_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "structure" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instrument_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instrument_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "template_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "structure_snapshot" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instrument_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_bound_evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instrument_version_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "major_id" UUID,
    "semester" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "faculty_id" UUID NOT NULL,
    "cilos_snapshot" JSONB NOT NULL,
    "course_info_snapshot" JSONB NOT NULL,
    "activation_at" TIMESTAMP(3),
    "deadline_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_bound_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "central_deployments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instrument_version_id" UUID NOT NULL,
    "program_id" UUID,
    "target_stakeholder" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "activation_at" TIMESTAMP(3),
    "deadline_at" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "central_deployments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluation_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_bound_id" UUID,
    "central_deployment_id" UUID,
    "respondent_id" UUID NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assignment_id" UUID NOT NULL,
    "respondent_id" UUID NOT NULL,
    "deployment_type" TEXT NOT NULL,
    "deployment_id" UUID NOT NULL,
    "status" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quantitative_response_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "response_id" UUID NOT NULL,
    "section_key" TEXT NOT NULL,
    "item_key" TEXT NOT NULL,
    "rating_value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quantitative_response_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualitative_response_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "response_id" UUID NOT NULL,
    "section_key" TEXT NOT NULL,
    "prompt_key" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "qualitative_response_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE UNIQUE INDEX "course_types_name_key" ON "course_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "year_levels_name_key" ON "year_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "student_academic_profiles_user_id_key" ON "student_academic_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "instrument_templates_code_key" ON "instrument_templates"("code");

-- CreateIndex
CREATE UNIQUE INDEX "instrument_versions_template_id_version_number_key" ON "instrument_versions"("template_id", "version_number");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "majors" ADD CONSTRAINT "majors_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "course_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_year_level_id_fkey" FOREIGN KEY ("year_level_id") REFERENCES "year_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic_profiles" ADD CONSTRAINT "student_academic_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic_profiles" ADD CONSTRAINT "student_academic_profiles_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic_profiles" ADD CONSTRAINT "student_academic_profiles_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic_profiles" ADD CONSTRAINT "student_academic_profiles_year_level_id_fkey" FOREIGN KEY ("year_level_id") REFERENCES "year_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_academic_profiles" ADD CONSTRAINT "student_academic_profiles_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plos" ADD CONSTRAINT "plos_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gos" ADD CONSTRAINT "gos_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cilos" ADD CONSTRAINT "cilos_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cilos" ADD CONSTRAINT "cilos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cilo_mappings" ADD CONSTRAINT "cilo_mappings_cilo_id_fkey" FOREIGN KEY ("cilo_id") REFERENCES "cilos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cilo_mappings" ADD CONSTRAINT "cilo_mappings_plo_id_fkey" FOREIGN KEY ("plo_id") REFERENCES "plos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cilo_mappings" ADD CONSTRAINT "cilo_mappings_go_id_fkey" FOREIGN KEY ("go_id") REFERENCES "gos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instrument_versions" ADD CONSTRAINT "instrument_versions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "instrument_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_instrument_version_id_fkey" FOREIGN KEY ("instrument_version_id") REFERENCES "instrument_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "majors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluations" ADD CONSTRAINT "course_bound_evaluations_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "central_deployments" ADD CONSTRAINT "central_deployments_instrument_version_id_fkey" FOREIGN KEY ("instrument_version_id") REFERENCES "instrument_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "central_deployments" ADD CONSTRAINT "central_deployments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_course_bound_id_fkey" FOREIGN KEY ("course_bound_id") REFERENCES "course_bound_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluation_assignments" ADD CONSTRAINT "evaluation_assignments_central_deployment_id_fkey" FOREIGN KEY ("central_deployment_id") REFERENCES "central_deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "evaluation_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_respondent_id_fkey" FOREIGN KEY ("respondent_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quantitative_response_items" ADD CONSTRAINT "quantitative_response_items_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualitative_response_items" ADD CONSTRAINT "qualitative_response_items_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
