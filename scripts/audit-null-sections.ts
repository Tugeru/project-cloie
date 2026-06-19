import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function auditNullSections() {
  console.log("Auditing course_assignments for NULL sections...\n");

  try {
    const result = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int as count 
      FROM course_assignments 
      WHERE section IS NULL
    `;

    const count = Number(result[0]?.count) || 0;

    if (count === 0) {
      console.log("✅ No NULL sections found in course_assignments table.");
      console.log("   Safe to proceed with SET NOT NULL migration.");
      return;
    }

    console.error(`❌ Found ${count} course_assignments with NULL section`);

    const sampleRows = await prisma.$queryRaw<{
      id: string;
      term_instance_id: string;
      course_id: string;
      faculty_id: string;
      program_id: string;
      year_level: string;
    }[]>`
      SELECT id, term_instance_id, course_id, faculty_id, program_id, year_level
      FROM course_assignments
      WHERE section IS NULL
      LIMIT 10
    `;

    console.error("\nSample rows with NULL section:");
    console.error("─".repeat(80));
    sampleRows.forEach((row: { id: string; term_instance_id: string; course_id: string; faculty_id: string; program_id: string; year_level: string }) => {
      console.error(
        `ID: ${row.id}\n` +
          `  Term Instance: ${row.term_instance_id}\n` +
          `  Course: ${row.course_id}\n` +
          `  Faculty: ${row.faculty_id}\n` +
          `  Program: ${row.program_id}\n` +
          `  Year Level: ${row.year_level}\n`
      );
    });

    if (sampleRows.length === 10) {
      console.error("... and more (showing first 10 of", count, "rows)");
    }

    console.error("\nAction required:");
    console.error("1. Update the rows above with appropriate section values (MORNING/AFTERNOON/EVENING)");
    console.error("2. Rerun this audit script to confirm zero NULL sections");
    console.error("3. Apply the NOT NULL migration");

    process.exit(1);
  } catch (error) {
    console.error("Error during audit:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

auditNullSections();
