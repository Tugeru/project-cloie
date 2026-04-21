-- CreateTable
CREATE TABLE "faculty_program_affiliations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "faculty_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_program_affiliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_head_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "program_head_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_head_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_bound_evaluation_targets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "course_bound_evaluation_id" UUID NOT NULL,
    "program_id" UUID NOT NULL,
    "year_level_id" UUID,
    "section_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_bound_evaluation_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "faculty_program_affiliations_faculty_id_program_id_key" ON "faculty_program_affiliations"("faculty_id", "program_id");

-- CreateIndex
CREATE UNIQUE INDEX "program_head_assignments_program_head_id_program_id_key" ON "program_head_assignments"("program_head_id", "program_id");

-- Collapse duplicate scoped CILOs before enforcing the scoped upsert key.
WITH ranked_cilos AS (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "course_id", "academic_term", "order"
            ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "keep_id",
        ROW_NUMBER() OVER (
            PARTITION BY "course_id", "academic_term", "order"
            ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "row_number"
    FROM "cilos"
), cilo_duplicates AS (
    SELECT "id" AS "duplicate_id", "keep_id"
    FROM ranked_cilos
    WHERE "row_number" > 1
)
UPDATE "cilo_mappings" AS "cm"
SET "cilo_id" = "cilo_duplicates"."keep_id"
FROM cilo_duplicates
WHERE "cm"."cilo_id" = "cilo_duplicates"."duplicate_id";

WITH ranked_cilos AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "course_id", "academic_term", "order"
            ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "row_number"
    FROM "cilos"
)
DELETE FROM "cilos"
WHERE "id" IN (
    SELECT "id"
    FROM ranked_cilos
    WHERE "row_number" > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "cilos_course_id_academic_term_order_key" ON "cilos"("course_id", "academic_term", "order");

-- Collapse duplicate course-bound evaluations before enforcing one published row per course context.
WITH ranked_course_bound_evaluations AS (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "course_id", "academic_year", "semester", "term"
            ORDER BY "published_at" DESC NULLS LAST, "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "keep_id",
        ROW_NUMBER() OVER (
            PARTITION BY "course_id", "academic_year", "semester", "term"
            ORDER BY "published_at" DESC NULLS LAST, "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "row_number"
    FROM "course_bound_evaluations"
), course_bound_duplicates AS (
    SELECT "id" AS "duplicate_id", "keep_id"
    FROM ranked_course_bound_evaluations
    WHERE "row_number" > 1
)
UPDATE "evaluation_assignments" AS "ea"
SET "course_bound_id" = course_bound_duplicates."keep_id"
FROM course_bound_duplicates
WHERE "ea"."course_bound_id" = course_bound_duplicates."duplicate_id";

WITH ranked_course_bound_evaluations AS (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "course_id", "academic_year", "semester", "term"
            ORDER BY "published_at" DESC NULLS LAST, "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "keep_id",
        ROW_NUMBER() OVER (
            PARTITION BY "course_id", "academic_year", "semester", "term"
            ORDER BY "published_at" DESC NULLS LAST, "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "row_number"
    FROM "course_bound_evaluations"
), course_bound_duplicates AS (
    SELECT "id" AS "duplicate_id", "keep_id"
    FROM ranked_course_bound_evaluations
    WHERE "row_number" > 1
)
UPDATE "responses" AS "r"
SET "deployment_id" = course_bound_duplicates."keep_id"
FROM course_bound_duplicates
WHERE "r"."deployment_type" = 'COURSE_BOUND'
  AND "r"."deployment_id" = course_bound_duplicates."duplicate_id";

WITH ranked_course_bound_evaluations AS (
    SELECT
        "id",
        FIRST_VALUE("id") OVER (
            PARTITION BY "course_id", "academic_year", "semester", "term"
            ORDER BY "published_at" DESC NULLS LAST, "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "keep_id",
        ROW_NUMBER() OVER (
            PARTITION BY "course_id", "academic_year", "semester", "term"
            ORDER BY "published_at" DESC NULLS LAST, "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "row_number"
    FROM "course_bound_evaluations"
), course_bound_duplicates AS (
    SELECT "id" AS "duplicate_id", "keep_id"
    FROM ranked_course_bound_evaluations
    WHERE "row_number" > 1
)
UPDATE "course_bound_evaluation_targets" AS "cbet"
SET "course_bound_evaluation_id" = course_bound_duplicates."keep_id"
FROM course_bound_duplicates
WHERE "cbet"."course_bound_evaluation_id" = course_bound_duplicates."duplicate_id";

WITH ranked_course_bound_evaluations AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "course_id", "academic_year", "semester", "term"
            ORDER BY "published_at" DESC NULLS LAST, "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "row_number"
    FROM "course_bound_evaluations"
)
DELETE FROM "course_bound_evaluations"
WHERE "id" IN (
    SELECT "id"
    FROM ranked_course_bound_evaluations
    WHERE "row_number" > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "course_bound_evaluations_course_id_academic_year_semester_term_key" ON "course_bound_evaluations"("course_id", "academic_year", "semester", "term");

WITH ranked_course_bound_evaluation_targets AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "course_bound_evaluation_id", "program_id", "year_level_id", "section_id"
            ORDER BY "updated_at" DESC, "created_at" DESC, "id" DESC
        ) AS "row_number"
    FROM "course_bound_evaluation_targets"
)
DELETE FROM "course_bound_evaluation_targets"
WHERE "id" IN (
    SELECT "id"
    FROM ranked_course_bound_evaluation_targets
    WHERE "row_number" > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "course_bound_evaluation_targets_course_bound_evaluation_id_program_id_year_level_id_section_id_key" ON "course_bound_evaluation_targets"("course_bound_evaluation_id", "program_id", "year_level_id", "section_id");

-- Remove duplicate responses before enforcing one response per assignment.
WITH ranked_responses AS (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "assignment_id"
            ORDER BY
                CASE WHEN "status" = 'SUBMITTED' THEN 0 ELSE 1 END,
                "submitted_at" DESC NULLS LAST,
                "updated_at" DESC,
                "created_at" DESC,
                "id" DESC
        ) AS "row_number"
    FROM "responses"
)
DELETE FROM "responses"
WHERE "id" IN (
    SELECT "id"
    FROM ranked_responses
    WHERE "row_number" > 1
);

-- CreateIndex
CREATE UNIQUE INDEX "responses_assignment_id_key" ON "responses"("assignment_id");

-- AddForeignKey
ALTER TABLE "faculty_program_affiliations" ADD CONSTRAINT "faculty_program_affiliations_faculty_id_fkey" FOREIGN KEY ("faculty_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faculty_program_affiliations" ADD CONSTRAINT "faculty_program_affiliations_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_head_assignments" ADD CONSTRAINT "program_head_assignments_program_head_id_fkey" FOREIGN KEY ("program_head_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_head_assignments" ADD CONSTRAINT "program_head_assignments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluation_targets" ADD CONSTRAINT "course_bound_evaluation_targets_course_bound_evaluation_id_fkey" FOREIGN KEY ("course_bound_evaluation_id") REFERENCES "course_bound_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluation_targets" ADD CONSTRAINT "course_bound_evaluation_targets_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluation_targets" ADD CONSTRAINT "course_bound_evaluation_targets_year_level_id_fkey" FOREIGN KEY ("year_level_id") REFERENCES "year_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_bound_evaluation_targets" ADD CONSTRAINT "course_bound_evaluation_targets_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;
