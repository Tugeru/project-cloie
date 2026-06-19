#!/usr/bin/env tsx
/**
 * Precise audit: Find ONLY references to course_bound_evaluations legacy columns.
 * Excludes references to other tables' columns.
 */

import { readdir, readFile } from "fs/promises";
import { join, extname } from "path";

const SRC_DIR = join(process.cwd(), "src");

// Patterns that specifically reference course_bound_evaluations table columns
const CBE_LEGACY_PATTERNS = [
  // Direct table references: course_bound_evaluations.course_id
  /course_bound_evaluations\.\s*(course_id|faculty_id|program_id|major_id|section)/gi,
  
  // CBE model aliasing: cbe.course_id, evaluation.faculty_id (in CBE context)
  /\b(cbe|dbe|courseBoundEvaluation|evaluation)\s*\.\s*(course_id|faculty_id|program_id|major_id)\b/gi,
  
  // Prisma includes/selects specific to CBE
  /course_bound_evaluation[^}]*\{[^}]*(course_id|faculty_id|program_id|major_id)[^}]*\}/gis,
  
  // Supabase type references specific to CBE table
  /course_bound_evaluations[^{]*\{[^}]*(course_id|faculty_id|program_id|major_id)[^}]*\}/gis,
];

async function main() {
  console.log("🔍 Precise audit: course_bound_evaluations legacy column references\n");
  
  const allFiles = await findFiles(SRC_DIR);
  const findings: Array<{ file: string; line: number; content: string }> = [];
  
  for (const file of allFiles) {
    const content = await readFile(file, "utf-8");
    const lines = content.split("\n");
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Skip comments
      if (line.trim().startsWith("//") || line.trim().startsWith("*")) {
        continue;
      }
      
      // Check each pattern
      for (const pattern of CBE_LEGACY_PATTERNS) {
        const match = pattern.exec(line);
        if (match) {
          findings.push({
            file: file.replace(process.cwd() + "/", ""),
            line: lineNum,
            content: line.trim().substring(0, 120),
          });
          break;
        }
      }
    }
  }
  
  if (findings.length === 0) {
    console.log("\n✅ **AUDIT PASSED** - No references to course_bound_evaluations legacy columns found!");
    console.log("\n**SAFE TO PROCEED** with destructive migration (Issue #45).\n");
  } else {
    console.log(`\n❌ Found ${findings.length} reference(s) to course_bound_evaluations legacy columns:\n`);
    findings.forEach(f => {
      console.log(`  📄 ${f.file}:${f.line}`);
      console.log(`     ${f.content}\n`);
    });
    console.log("\n**CANNOT PROCEED** - must remove these references first.\n");
  }
  
  process.exit(findings.length === 0 ? 0 : 1);
}

async function findFiles(dir: string, extensions: string[] = [".ts", ".tsx"]): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "__fixtures__") continue;
        files.push(...(await findFiles(fullPath, extensions)));
      } else if (entry.isFile() && extensions.includes(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch {}
  return files;
}

main().catch(console.error);
