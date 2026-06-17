-- DropForeignKey
ALTER TABLE "alumni_profiles" DROP CONSTRAINT "alumni_profiles_major_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "majors_id_program_id_key" ON "majors"("id", "program_id");

-- AddForeignKey
ALTER TABLE "alumni_profiles" ADD CONSTRAINT "alumni_profiles_major_id_program_id_fkey" FOREIGN KEY ("major_id", "program_id") REFERENCES "majors"("id", "program_id") ON DELETE SET NULL ON UPDATE CASCADE;
