#!/usr/bin/env tsx
/**
 * Precise Audit script: Find all code references to legacy CourseBoundEvaluation columns.
 * 
 * Legacy columns to be dropped (per Issue #45):
 * - course_id (redundant: use course_assignment.course_id)
 * - faculty_id (redundant: use course_assignment.faculty_id)
 * - program_id (redundant: use course_assignment.program_id)
 * - major_id (redundant: use course_assignment.course.major_id)
 * - section (redundant: use course_assignment.section)
 * 
 * This precise version targets only accesses to CourseBoundEvaluation types or model fields.
 * 
 * Run with: pnpm tsx scripts/audit-cbe-legacy-columns-precise.ts
 */

import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";

const SRC_DIR = join(process.cwd(), "src");
const LEGACY_COLUMNS = ["course_id", "faculty_id", "program_id", "major_id", "section"];

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
        if (entry.name === "node_modules" || entry.name === "__fixtures__" || entry.name === ".next" || entry.name === "dist") {
          continue;
        }
        files.push(...(await findFiles(fullPath, extensions)));
      } else if (entry.isFile() && extensions.includes(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // ignore
  }
  
  return files;
}

async function searchFile(filePath: string): Promise<Finding[]> {
  const findings: Finding[] = [];
  
  try {
    const content = await readFile(filePath, "utf-8");
    
    // Check if the file mentions CourseBoundEvaluation or related models/types first
    // to keep it fast and precise.
    const hasCbeMention = /courseBoundEvaluation|course_bound_evaluation|CBE\b/i.test(content);
    if (!hasCbeMention) {
      return [];
    }

    const lines = content.split("\n");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Skip comments
      const trimmed = line.trim();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
        continue;
      }
      
      for (const column of LEGACY_COLUMNS) {
        // Precise regexes (no /g flag to prevent stateful exec/test match skipping)
        const patterns = [
          // Prisma select, create, update, or where referencing the legacy column inside courseBoundEvaluation blocks
          // e.g. courseBoundEvaluation: { select: { course_id: true } } or courseBoundEvaluation: { create: { course_id: ... } }
          // or inside findFirst/findUnique where block that matches cbe
          new RegExp(`courseBoundEvaluation[^]*?\\{[^}]*?\\b${column}\\b`, "i"),
          
          // Direct model accesses like: cbe.course_id or evaluation.course_id (specifically for course bound evaluations)
          new RegExp(`\\b(cbe|courseBoundEvaluation|evaluation)\\.${column}\\b`, "i"),
          
          // SQL schema column reference or raw queries
          new RegExp(`course_bound_evaluations\\.${column}\\b`, "i")
        ];
        
        for (const pattern of patterns) {
          // Note: Since some regexes match across multiple lines (e.g. courseBoundEvaluation[^]*?), 
          // we match the pattern against a slice of the content around this line if needed, 
          // or just test the current line for direct references.
          
          // If the pattern is multiline-like, let's test it on a slice.
          // For simplicity, we check if the pattern matches a block of 3 lines around the current line.
          const contextSlice = lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join("\n");
          
          if (pattern.test(contextSlice)) {
            // Additional check to avoid false positives:
            // Ensure the line itself actually contains the column name
            if (line.includes(column)) {
              findings.push({
                file: filePath,
                line: lineNum,
                column,
                lineContent: trimmed,
              });
              break; // Don't report the same line multiple times for the same column
            }
          }
        }
      }
    }
  } catch (error) {
    // ignore
  }
  
  return findings;
}

async function main() {
  console.log("🔍 Auditing codebase precisely for legacy CourseBoundEvaluation column references...\n");
  
  const allFiles = await findFiles(SRC_DIR);
  const allFindings: Finding[] = [];
  
  for (const file of allFiles) {
    // Skip test files to avoid auditing test mocks or test code that is being refactored/cleaned up
    if (file.includes(".test.") || file.includes("__tests__")) {
      continue;
    }
    const findings = await searchFile(file);
    allFindings.push(...findings);
  }
  
  const totalFindings = allFindings.length;
  
  if (totalFindings === 0) {
    console.log("✅ **AUDIT PASSED** - Zero precise references to legacy CourseBoundEvaluation columns found in src/.");
    process.exit(0);
  } else {
    console.log(`❌ **AUDIT FAILED** - Found ${totalFindings} references to legacy columns:`);
    allFindings.forEach(f => {
      console.log(`   ${f.file}:${f.line} [col: ${f.column}] -> ${f.lineContent}`);
    });
    process.exit(1);
  }
}

main().catch(console.error);
