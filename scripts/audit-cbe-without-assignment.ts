import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function auditCBEWithoutAssignment() {
  console.log("Auditing course_bound_evaluations for NULL course_assignment_id...\n");

  try {
    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count 
      FROM course_bound_evaluations 
      WHERE course_assignment_id IS NULL
    `;

    const count = Number(result[0]?.count) || 0;

    if (count === 0) {
      console.log("✅ No NULL course_assignment_id found in course_bound_evaluations table.");
      console.log("   Safe to proceed with SET NOT NULL + UNIQUE migration.");
      return;
    }

    console.error(`❌ Found ${count} course_bound_evaluations with NULL course_assignment_id`);

    const sampleRows = await prisma.$queryRaw<{
      id: string;
      term_instance_id: string;
      course_id: string;
      faculty_id: string;
      program_id: string;
      major_id: string | null;
      section: string | null;
      deployment_name: string;
    }>`
      SELECT id, term_instance_id, course_id, faculty_id, program_id, major_id, section, deployment_name
      FROM course_bound_evaluations
      WHERE course_assignment_id IS NULL
      LIMIT 10
    `;

    console.error("\nSample rows with NULL course_assignment_id:");
    console.error("─".repeat(100));
    sampleRows.forEach((row: {
      id: string;
      term_instance_id: string;
      course_id: string;
      faculty_id: string;
      program_id: string;
      major_id: string | null;
      section: string | null;
      deployment_name: string;
    }) => {
      console.error(
        `CBE ID:          ${row.id}\n` +
          `  Deployment:      ${row.deployment_name}\n` +
          `  Term Instance:   ${row.term_instance_id}\n` +
          `  Course:          ${row.course_id}\n` +
          `  Faculty:         ${row.faculty_id}\n` +
          `  Program:         ${row.program_id}\n` +
          `  Major:           ${row.major_id ?? "(null)"}\n` +
          `  Section:         ${row.section ?? "(null)"}\n`
      );
    });

    if (sampleRows.length === 10) {
      console.error("... and more (showing first 10 of", count, "rows)");
    }

    console.error("\nAction required:");
    console.error("1. These CBEs need to be backfilled by matching to course_assignments on:");
    console.error("   [term_instance_id, course_id, faculty_id, section]");
    console.error("2. The backfill migration will handle this automatically.");
    console.error("3. Rerun this audit script after backfill to confirm zero NULLs");
    console.error("4. Then apply the NOT NULL + UNIQUE constraint migration");

    process.exit(1);
  } catch (error) {
    console.error("Error during audit:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

auditCBEWithoutAssignment();
