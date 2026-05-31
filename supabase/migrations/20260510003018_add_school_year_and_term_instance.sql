-- CreateTable: school_years
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

-- CreateIndex: unique code
CREATE UNIQUE INDEX "school_years_code_key" ON "school_years"("code");

-- CreateTable: academic_term_instances
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

-- AddForeignKey: academic_term_instances -> school_years
ALTER TABLE "academic_term_instances" ADD CONSTRAINT "academic_term_instances_school_year_id_fkey" 
    FOREIGN KEY ("school_year_id") REFERENCES "school_years"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: school_years.archived_by -> users
ALTER TABLE "school_years" ADD CONSTRAINT "school_years_archived_by_fkey" 
    FOREIGN KEY ("archived_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: school_year_id + semester + term with NULLS NOT DISTINCT
-- Note: Prisma does not support NULLS NOT DISTINCT, so we use raw SQL
CREATE UNIQUE INDEX "academic_term_instances_school_year_semester_term_key" 
    ON "academic_term_instances"("school_year_id", "semester", "term") 
    NULLS NOT DISTINCT;

-- CreateIndex: is_active for fast lookup
CREATE INDEX "academic_term_instances_is_active_idx" ON "academic_term_instances"("is_active");

-- CreateIndex: school_year_id for term lookups
CREATE INDEX "academic_term_instances_school_year_id_idx" ON "academic_term_instances"("school_year_id");

-- CreatePartialUniqueIndex: enforce single active term instance
-- This ensures only one row can have is_active = true at a time
CREATE UNIQUE INDEX "one_active_term_instance" ON "academic_term_instances"("is_active") 
    WHERE "is_active" = true;

-- Enable RLS on new tables
ALTER TABLE "school_years" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "academic_term_instances" ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
-- School years: Admin full access, others read-only active
CREATE POLICY "Enable read access for authenticated users" ON "school_years"
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for admin only" ON "school_years"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "user_roles" ur
            JOIN "users" u ON ur."user_id" = u."id"
            WHERE u."id" = auth.uid() AND ur."role" = 'ADMIN'
        )
    );

-- Academic term instances: Admin full access, others read-only
CREATE POLICY "Enable read access for authenticated users" ON "academic_term_instances"
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for admin only" ON "academic_term_instances"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM "user_roles" ur
            JOIN "users" u ON ur."user_id" = u."id"
            WHERE u."id" = auth.uid() AND ur."role" = 'ADMIN'
        )
    );
