#!/usr/bin/env tsx
/**
 * Audit script: Find all code references to legacy CourseBoundEvaluation columns.
 * 
 * Legacy columns to be dropped (per Issue #45):
 * - course_id (redundant: use course_assignment.course_id)
 * - faculty_id (redundant: use course_assignment.faculty_id)
 * - program_id (redundant: use course_assignment.program_id)
 * - major_id (redundant: use course_assignment.course.major_id)
 * - section (redundant: use course_assignment.section)
 * 
 * Kept columns:
 * - term_instance_id (still needed for query scoping)
 * - course_assignment_id (source of truth after Issue #39)
 * - deployed_by (added in Issue #43 for on-behalf deployment)
 * 
 * Run with: pnpm tsx scripts/audit-cbe-legacy-column-readers.ts
 */

import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";

const SRC_DIR = join(process.cwd(), "src");
const LEGACY_COLUMNS = [
  { column: "course_id", table: "course_bound_evaluations" },
  { column: "faculty_id", table: "course_bound_evaluations" },
  { column: "program_id", table: "course_bound_evaluations" },
  { column: "major_id", table: "course_bound_evaluations" },
  { column: "section", table: "course_bound_evaluations" },
];

interface Finding {
  file: string;
  line: number;
  column: string;
  lineContent: string;
}

async function findFiles(dir: string, extensions: string[] = [".ts", ".tsx"]): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and test fixtures
        if (entry.name === "node_modules" || entry.name === "__fixtures__") {
          continue;
        }
        files.push(...(await findFiles(fullPath, extensions)));
      } else if (entry.isFile() && extensions.includes(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Skip unreadable directories
  }
  
  return files;
}

async function searchFile(filePath: string, columns: string[]): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.split("\n");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Skip comments and strings that are just documentation
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
        continue;
      }
      
      for (const column of columns) {
        // Look for references to the column in various contexts
        const patterns = [
          // Direct property access: cbe.course_id, evaluation.faculty_id
          new RegExp(`\\b(courseBoundEvaluation|evaluation|cbe|dbe)\\s*\\.\\s*${column}\\b`, "i"),
          
          // Object destructuring: const { course_id, faculty_id } = ...
          new RegExp(`\\{[^}]*\\b${column}\\b[^}]*\\}`),
          
          // Select/include in Prisma queries
          new RegExp(`(select|include)[^}]*\\b${column}\\b`),
          
          // Where clauses
          new RegExp(`where[^}]*\\b${column}\\b`),
          
          // Column references in SQL or raw queries
          new RegExp(`(course_bound_evaluations|cbe)\\.${column}`),
          
          // Variable names that directly reference the column
          new RegExp(`\\b${column}\\s*[=:]`),
        ];
        
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            findings.push({
              file: filePath,
              line: lineNum,
              column,
              lineContent: line.trim(),
            });
            break; // Don't report same line multiple times for same column
          }
        }
      }
    }
  } catch (error) {
    // Skip unreadable files
  }
  
  return findings;
}

async function main() {
  console.log("🔍 Auditing codebase for legacy CourseBoundEvaluation column references\n");
  console.log("Legacy columns to drop:");
  LEGACY_COLUMNS.forEach(({ column }) => console.log(`  - course_bound_evaluations.${column}`));
  console.log("\n" + "=".repeat(80) + "\n");
  
  const allFiles = await findFiles(SRC_DIR);
  const allFindings: Finding[] = [];
  
  for (const file of allFiles) {
    const findings = await searchFile(
      file, 
      LEGACY_COLUMNS.map(c => c.column)
    );
    allFindings.push(...findings);
  }
  
  // Group findings by column
  const byColumn = new Map<string, Finding[]>();
  LEGACY_COLUMNS.forEach(({ column }) => byColumn.set(column, []));
  
  allFindings.forEach(finding => {
    const existing = byColumn.get(finding.column) || [];
    existing.push(finding);
    byColumn.set(finding.column, existing);
  });
  
  // Report findings
  let totalFindings = 0;
  
  for (const { column } of LEGACY_COLUMNS) {
    const findings = byColumn.get(column) || [];
    totalFindings += findings.length;
    
    if (findings.length === 0) {
      console.log(`✅ ${column}: No references found`);
    } else {
      console.log(`\n⚠️  ${column}: ${findings.length} reference(s) found`);
      console.log("─".repeat(60));
      
      // Group by file for cleaner output
      const byFile = new Map<string, Finding[]>();
      findings.forEach(f => {
        const existing = byFile.get(f.file) || [];
        existing.push(f);
        byFile.set(f.file, existing);
      });
      
      for (const [file, fileFindings] of byFile.entries()) {
        const relativePath = file.replace(process.cwd() + "/", "");
        console.log(`\n📄 ${relativePath}`);
        fileFindings.forEach(f => {
          console.log(`   L${f.line}: ${f.lineContent.substring(0, 100)}${f.lineContent.length > 100 ? "..." : ""}`);
        });
      }
    }
  }
  
  console.log("\n" + "=".repeat(80));
  console.log(`\n📊 Summary: ${totalFindings} total reference(s) across ${LEGACY_COLUMNS.length} legacy columns`);
  
  if (totalFindings === 0) {
    console.log("\n✅ **AUDIT PASSED** - No code references to legacy columns found.");
    console.log("   Safe to proceed with destructive migration (Issue #45).");
    console.log("\n   Next steps:");
    console.log("   1. Review this output with the team");
    console.log("   2. Get human approval for destructive migration");
    console.log("   3. Create Supabase migration to drop columns");
    console.log("   4. Update Prisma schema and regenerate types");
    console.log("   5. Update tests and run full suite");
  } else {
    console.log("\n❌ **AUDIT FAILED** - Code still references legacy columns.");
    console.log("   Cannot proceed with destructive migration until all references are removed.");
    console.log("\n   Required actions:");
    console.log("   1. Review each finding above");
    console.log("   2. Update code to use course_assignment relations instead");
    console.log("   3. Re-run this audit script");
    console.log("   4. Repeat until zero references remain");
  }
  
  console.log("\n" + "=".repeat(80) + "\n");
  
  // Exit with appropriate code
  process.exit(totalFindings === 0 ? 0 : 1);
}

main().catch(console.error);
