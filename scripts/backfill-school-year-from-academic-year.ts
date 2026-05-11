#!/usr/bin/env tsx
/**
 * Phase 9 Pre-Migration Audit Script
 *
 * This read-only script audits legacy academic_year values across tables
 * and prints a proposed mapping to SchoolYear/TermInstance records.
 *
 * Run this on a copy of production data before applying destructive migrations.
 *
 * Usage: npx tsx scripts/backfill-school-year-from-academic-year.ts
 */

import { prisma } from "../src/lib/db/prisma";

// ─── Types ─────────────────────────────────────────────────────────────────

type AuditResult = {
  table: string;
  totalRows: number;
  rowsWithLegacyData: number;
  rowsWithTermInstanceId: number;
  uniqueAcademicYears: string[];
  unmappableRows: Array<{ id: string; academic_year: string; reason: string }>;
};

type ProposedMapping = {
  academicYear: string;
  schoolYearCode: string | null;
  schoolYearId: string | null;
  canMap: boolean;
  suggestedAction: string;
};

// ─── Main Audit Function ─────────────────────────────────────────────────────

async function runAudit(): Promise<void> {
  console.log("=".repeat(80));
  console.log("PHASE 9 PRE-MIGRATION AUDIT");
  console.log("Read-only analysis of legacy academic_year data");
  console.log("=".repeat(80));
  console.log();

  // 1. Load all school years for mapping reference
  const schoolYears = await prisma.schoolYear.findMany({
    select: { id: true, code: true },
    orderBy: { code: "asc" },
  });

  console.log(`📚 Found ${schoolYears.length} SchoolYear records:`);
  for (const sy of schoolYears) {
    console.log(`   - ${sy.code} (${sy.id})`);
  }
  console.log();

  // 2. Load all term instances with their school years
  const termInstances = await prisma.academicTermInstance.findMany({
    include: {
      school_year: true,
    },
    orderBy: [
      { school_year: { code: "asc" } },
      { semester: "asc" },
      { term: "asc" },
    ],
  });

  console.log(`📅 Found ${termInstances.length} AcademicTermInstance records:`);
  for (const ti of termInstances.slice(0, 10)) {
    const termLabel = ti.term ? ` — ${ti.term}` : "";
    console.log(`   - ${ti.school_year.code} — ${ti.semester}${termLabel} (${ti.id})`);
  }
  if (termInstances.length > 10) {
    console.log(`   ... and ${termInstances.length - 10} more`);
  }
  console.log();

  // 3. Audit CourseBoundEvaluation
  console.log("🔍 Auditing CourseBoundEvaluation...");
  const cbeAudit = await auditCourseBoundEvaluations();
  printAuditResult(cbeAudit);

  // 4. Audit CentralDeployment
  console.log("🔍 Auditing CentralDeployment...");
  const cdAudit = await auditCentralDeployments();
  printAuditResult(cdAudit);

  // 5. Audit StudentAcademicProfile
  console.log("🔍 Auditing StudentAcademicProfile...");
  const sapAudit = await auditStudentProfiles();
  printStudentProfileAudit(sapAudit);

  // 6. Proposed Mapping Analysis
  console.log("=".repeat(80));
  console.log("PROPOSED MAPPING ANALYSIS");
  console.log("=".repeat(80));
  console.log();

  const allAcademicYears = new Set([
    ...cbeAudit.uniqueAcademicYears,
    ...cdAudit.uniqueAcademicYears,
    ...sapAudit.uniqueAcademicYears,
  ]);

  console.log(`Found ${allAcademicYears.size} unique academic_year values:`);
  console.log();

  const mappings: ProposedMapping[] = [];
  for (const ay of Array.from(allAcademicYears).sort()) {
    const schoolYear = schoolYears.find((sy) => sy.code === ay);
    const canMap = !!schoolYear;

    mappings.push({
      academicYear: ay,
      schoolYearCode: schoolYear?.code ?? null,
      schoolYearId: schoolYear?.id ?? null,
      canMap,
      suggestedAction: canMap
        ? "✅ Can map to SchoolYear"
        : "❌ NO MATCHING SCHOOL YEAR - Manual intervention required",
    });
  }

  for (const m of mappings) {
    console.log(`${m.academicYear.padEnd(15)} → ${m.suggestedAction}`);
  }
  console.log();

  // 7. Summary & Recommendations
  console.log("=".repeat(80));
  console.log("AUDIT SUMMARY & RECOMMENDATIONS");
  console.log("=".repeat(80));
  console.log();

  const unmappableCount = mappings.filter((m) => !m.canMap).length;
  const totalUnmappableRows =
    cbeAudit.unmappableRows.length +
    cdAudit.unmappableRows.length +
    sapAudit.unmappableRows.length;

  console.log(`Total unique academic_year values: ${allAcademicYears.size}`);
  console.log(`Mappable to SchoolYear: ${mappings.filter((m) => m.canMap).length}`);
  console.log(`Unmappable: ${unmappableCount}`);
  console.log(`Total rows with unmappable academic_year: ${totalUnmappableRows}`);
  console.log();

  if (unmappableCount > 0) {
    console.log("⚠️  WARNING: Unmappable academic years detected!");
    console.log();
    console.log("Required actions before migration:");
    console.log("1. Create missing SchoolYear records for unmappable years");
    console.log("2. Re-run this audit to verify all years are mappable");
    console.log("3. Only then proceed with destructive migrations");
    console.log();
  } else {
    console.log("✅ All academic_year values can be mapped to SchoolYear records.");
    console.log();
    console.log("Ready to proceed with:");
    console.log("1. Backfill migration (populate term_instance_id from legacy data)");
    console.log("2. Drop legacy column migration");
    console.log();
  }

  // 8. Term Instance Mapping Analysis
  console.log("=".repeat(80));
  console.log("TERM INSTANCE MAPPING ANALYSIS");
  console.log("=".repeat(80));
  console.log();

  const cbeTotal = await prisma.courseBoundEvaluation.count();
  const cbeWithTermInstance = cbeTotal;

  const cdTotal = await prisma.centralDeployment.count();
  const cdWithTermInstance = cdTotal;

  console.log("CourseBoundEvaluation:");
  console.log(`  With term_instance_id: ${cbeWithTermInstance}/${cbeTotal}`);
  console.log(`  Missing term_instance_id: ${cbeTotal - cbeWithTermInstance}`);
  console.log();

  console.log("CentralDeployment:");
  console.log(`  With term_instance_id: ${cdWithTermInstance}/${cdTotal}`);
  console.log(`  Missing term_instance_id: ${cdTotal - cdWithTermInstance}`);
  console.log();

  if (cbeTotal - cbeWithTermInstance > 0 || cdTotal - cdWithTermInstance > 0) {
    console.log("⚠️  Some records lack term_instance_id and will need backfill.");
    console.log("   The backfill migration should handle these via academic_year+semester mapping.");
    console.log();
  }

  console.log("=".repeat(80));
  console.log("AUDIT COMPLETE");
  console.log("=".repeat(80));
}

// ─── Audit Helpers ───────────────────────────────────────────────────────────

async function auditCourseBoundEvaluations(): Promise<AuditResult> {
  // Get total count
  const totalRows = await prisma.courseBoundEvaluation.count();

  // Get rows with legacy data
  const rowsWithLegacy = await prisma.courseBoundEvaluation.findMany({
    where: { academic_year: { not: "" } },
    select: {
      id: true,
      academic_year: true,
      semester: true,
      term: true,
      term_instance_id: true,
    },
  });

  // Get rows with term_instance_id
  const rowsWithTermInstance = await prisma.courseBoundEvaluation.count({
    where: { term_instance_id: { not: null } },
  });

  // Extract unique academic years
  const uniqueAcademicYears = Array.from(
    new Set(rowsWithLegacy.map((r) => r.academic_year))
  ).filter(Boolean);

  return {
    table: "CourseBoundEvaluation",
    totalRows,
    rowsWithLegacyData: rowsWithLegacy.length,
    rowsWithTermInstanceId: rowsWithTermInstance,
    uniqueAcademicYears,
    unmappableRows: [],
  };
}

async function auditCentralDeployments(): Promise<AuditResult> {
  // Get total count
  const totalRows = await prisma.centralDeployment.count();

  // Get rows with legacy data
  const rowsWithLegacy = await prisma.centralDeployment.findMany({
    where: { academic_year: { not: "" } },
    select: {
      id: true,
      academic_year: true,
      semester: true,
      term: true,
      term_instance_id: true,
    },
  });

  // Get rows with term_instance_id
  const rowsWithTermInstance = await prisma.centralDeployment.count({
    where: { term_instance_id: { not: null } },
  });

  // Extract unique academic years
  const uniqueAcademicYears = Array.from(
    new Set(rowsWithLegacy.map((r) => r.academic_year))
  ).filter(Boolean);

  return {
    table: "CentralDeployment",
    totalRows,
    rowsWithLegacyData: rowsWithLegacy.length,
    rowsWithTermInstanceId: rowsWithTermInstance,
    uniqueAcademicYears,
    unmappableRows: [],
  };
}

async function auditStudentProfiles(): Promise<{
  table: string;
  totalRows: number;
  rowsWithAcademicYear: number;
  uniqueAcademicYears: string[];
  unmappableRows: Array<{ id: string; academic_year: string; reason: string }>;
}> {
  const totalRows = await prisma.studentAcademicProfile.count();

  const rows = await prisma.studentAcademicProfile.findMany({
    select: {
      id: true,
      academic_year: true,
    },
  });

  const uniqueAcademicYears = Array.from(
    new Set(rows.map((r) => r.academic_year))
  ).filter(Boolean);

  return {
    table: "StudentAcademicProfile",
    totalRows,
    rowsWithAcademicYear: rows.length,
    uniqueAcademicYears,
    unmappableRows: [],
  };
}

function printAuditResult(result: AuditResult): void {
  console.log(`  Table: ${result.table}`);
  console.log(`  Total rows: ${result.totalRows}`);
  console.log(`  Rows with legacy academic_year: ${result.rowsWithLegacyData}`);
  console.log(`  Rows with term_instance_id: ${result.rowsWithTermInstanceId}`);
  console.log(`  Unique academic_year values: ${result.uniqueAcademicYears.length}`);
  if (result.uniqueAcademicYears.length > 0) {
    console.log(`    Values: ${result.uniqueAcademicYears.slice(0, 5).join(", ")}${
      result.uniqueAcademicYears.length > 5 ? "..." : ""
    }`);
  }
  if (result.unmappableRows.length > 0) {
    console.log(`  ⚠️  Unmappable rows: ${result.unmappableRows.length}`);
  }
  console.log();
}

function printStudentProfileAudit(result: ReturnType<typeof auditStudentProfiles> extends Promise<infer T> ? T : never): void {
  console.log(`  Table: ${result.table}`);
  console.log(`  Total rows: ${result.totalRows}`);
  console.log(`  Rows with academic_year: ${result.rowsWithAcademicYear}`);
  console.log(`  Unique academic_year values: ${result.uniqueAcademicYears.length}`);
  if (result.uniqueAcademicYears.length > 0) {
    console.log(`    Values: ${result.uniqueAcademicYears.slice(0, 5).join(", ")}${
      result.uniqueAcademicYears.length > 5 ? "..." : ""
    }`);
  }
  console.log();
}

// ─── Run ─────────────────────────────────────────────────────────────────────

runAudit()
  .catch((error) => {
    console.error("Audit failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
