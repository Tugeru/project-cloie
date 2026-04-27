import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

import { getSupabaseCommand } from "./supabase-cli";

export const OUTPUT_PATH = "src/types/supabase-database.ts";

export function buildTypegenArgs() {
  return ["gen", "types", "typescript", "--linked", "--schema", "public"];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = execFileSync(getSupabaseCommand(), buildTypegenArgs(), {
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, output);

  console.log(`Wrote ${OUTPUT_PATH}`);
}
