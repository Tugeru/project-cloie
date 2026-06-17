import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import { getSupabaseCommand } from "./supabase-cli";
import { loadEnvConfig } from "@next/env";

export const OUTPUT_PATH = "src/types/supabase-database.ts";

export function buildTypegenArgs() {
  return ["gen", "types", "typescript", "--linked", "--schema", "public"];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadEnvConfig(process.cwd());
  let output: string;
  try {
    output = execFileSync(getSupabaseCommand(), buildTypegenArgs(), {
      encoding: "utf8",
      shell: process.platform === "win32",
    });
  } catch (error) {
    const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (dbUrl) {
      console.warn("Typegen using '--linked' failed. Falling back to '--db-url'...");
      output = execFileSync(
        getSupabaseCommand(),
        ["gen", "types", "typescript", "--db-url", dbUrl, "--schema", "public"],
        {
          encoding: "utf8",
          shell: process.platform === "win32",
        }
      );
    } else {
      throw error;
    }
  }

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, output);

  console.log(`Wrote ${OUTPUT_PATH}`);
}
