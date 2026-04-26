import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { getSupabaseCommand } from "./supabase-cli";

export function getLatestMigrationVersion(files: string[], source = "supabase/migrations") {
  const sqlFiles = files.filter((file) => /^\d{14}_.+\.sql$/.test(file)).sort();

  if (sqlFiles.length === 0) {
    throw new Error(
      `No Supabase SQL migrations were found in ${source}. Run pnpm supabase:migration:baseline or pnpm supabase:migration:diff first.`
    );
  }

  return sqlFiles.at(-1)!.slice(0, 14);
}

export function getLatestMigrationVersionFromDirectory(
  migrationsPath: string,
  readDirectory: (path: string) => string[] = readdirSync
) {
  try {
    return getLatestMigrationVersion(readDirectory(migrationsPath), migrationsPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `Supabase migrations directory was not found at ${migrationsPath}. Run pnpm supabase:init and create a migration first.`
      );
    }

    throw error;
  }
}

export function parseRemoteMigrationVersions(migrationListOutput: string) {
  return migrationListOutput
    .split(/\r?\n/)
    .map((line) => line.split("|").map((segment) => segment.trim()))
    .filter((segments) => segments.length >= 2)
    .map((segments) => segments[1])
    .filter((remoteVersion) => /^\d{14}$/.test(remoteVersion));
}

export function assertBaselineRepairSafe(remoteVersions: string[]) {
  if (remoteVersions.length > 0) {
    throw new Error(
      `The linked project already has remote migration history (latest remote version: ${remoteVersions.at(-1)}). \`pnpm supabase:migration:repair-latest\` is only for an empty remote history during baseline setup or recovery.`
    );
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const status = process.argv[2] ?? "applied";
  const migrationsPath = join("supabase", "migrations");
  const version = getLatestMigrationVersionFromDirectory(migrationsPath);
  const migrationListOutput = execFileSync(
    getSupabaseCommand(),
    ["migration", "list", "--linked"],
    { encoding: "utf8", shell: process.platform === "win32" }
  );

  assertBaselineRepairSafe(parseRemoteMigrationVersions(migrationListOutput));

  execFileSync(
    getSupabaseCommand(),
    ["migration", "repair", version, "--status", status, "--linked"],
    { shell: process.platform === "win32", stdio: "inherit" }
  );

  console.log(`Repaired linked migration history for ${version} as ${status}`);
}
