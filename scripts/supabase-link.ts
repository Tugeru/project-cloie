import { execFileSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { pathToFileURL } from "node:url";

import { getSupabaseCommand } from "./supabase-cli";

loadEnvConfig(process.cwd());

export function buildLinkArgs(projectRef: string, dbPassword?: string) {
  const args = ["link", "--project-ref", projectRef];

  if (dbPassword) {
    args.push("--password", dbPassword);
  }

  return args;
}

function requireEnv(name: "SUPABASE_PROJECT_REF") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required before running pnpm supabase:link`);
  }

  return value;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const projectRef = requireEnv("SUPABASE_PROJECT_REF");
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  execFileSync(getSupabaseCommand(), buildLinkArgs(projectRef, dbPassword), {
    stdio: "inherit",
  });
}
