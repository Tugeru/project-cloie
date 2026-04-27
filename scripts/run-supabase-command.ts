import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { getSupabaseCommand } from "./supabase-cli";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  execFileSync(getSupabaseCommand(), process.argv.slice(2), {
    shell: process.platform === "win32",
    stdio: "inherit",
  });
}
