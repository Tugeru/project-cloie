import { execFileSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { pathToFileURL } from "node:url";

import { getSupabaseCommand } from "./supabase-cli";

loadEnvConfig(process.cwd());

export function buildLoginArgs(token: string) {
  return ["login", "--token", token];
}

function requireEnv(name: "SUPABASE_ACCESS_TOKEN") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required before running pnpm supabase:login`);
  }

  return value;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  execFileSync(getSupabaseCommand(), buildLoginArgs(requireEnv("SUPABASE_ACCESS_TOKEN")), {
    stdio: "inherit",
  });
}
