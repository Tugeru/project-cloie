# Supabase Cloud Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Git-tracked, cloud-only Supabase workflow to this repo so Prisma-owned schema changes become reviewed SQL migrations, Supabase CLI can operate against the linked hosted project, and the app uses generated Supabase database types.

**Architecture:** Keep `prisma/schema.prisma` as the source of truth for ordinary app tables, add a tracked `supabase/` workspace for migrations and config, and introduce small helper scripts that avoid Docker-dependent `supabase db pull` / `supabase db diff`. Baseline the existing hosted database by generating deterministic SQL from the Prisma datamodel, then mark that baseline as applied on the linked project so future changes can be pushed safely.

**Tech Stack:** Next.js 16, TypeScript, Prisma 6, Supabase CLI, Supabase Auth, Supabase Postgres, Vitest, pnpm

---

## File Map

- Modify: `package.json`
  Purpose: add the Supabase CLI dependency and stable repo scripts for link, migration, push, and type generation.
- Modify: `.env.example`
  Purpose: document the non-committed Supabase workflow secrets and project metadata needed by helper scripts.
- Create: `src/__tests__/config/supabase-cli-scripts.test.ts`
  Purpose: lock down the package scripts and documented env variables.
- Create: `scripts/supabase-link.ts`
  Purpose: run `supabase link` from `SUPABASE_PROJECT_REF` and optional `SUPABASE_DB_PASSWORD` without relying on shell-specific env expansion.
- Create: `scripts/supabase-login.ts`
  Purpose: run `supabase login --token ...` from `.env.local` so the agent can authenticate non-interactively.
- Create: `scripts/create-supabase-migration.ts`
  Purpose: generate deterministic SQL migrations from the Prisma datamodel without Docker by using `prisma migrate diff`.
- Create: `scripts/repair-latest-supabase-migration.ts`
  Purpose: mark the latest local Supabase migration as applied on the linked project during baselining.
- Create: `scripts/generate-supabase-types.ts`
  Purpose: generate `src/types/supabase-database.ts` from the linked project without shell redirection.
- Create: `src/__tests__/scripts/supabase-workflow-helpers.test.ts`
  Purpose: unit test the helper-script argument builders and deterministic file naming.
- Create: `supabase/config.toml`
  Purpose: tracked Supabase workspace config created by `supabase init`.
- Create: `supabase/migrations/20260419000100_init_public_schema.sql`
  Purpose: deterministic baseline migration generated from `prisma/schema.prisma`.
- Create: `src/types/supabase-database.ts`
  Purpose: generated database types from the linked hosted project.
- Modify: `src/lib/supabase/client.ts`
  Purpose: thread the generated `Database` type into the browser client.
- Modify: `src/lib/supabase/server.ts`
  Purpose: thread the generated `Database` type into the server client.
- Modify: `src/lib/supabase/middleware.ts`
  Purpose: thread the generated `Database` type into the middleware client.
- Create: `src/__tests__/config/supabase-client-typing.test.ts`
  Purpose: assert the generated `Database` type is used consistently across Supabase client factories.
- Create: `supabase/README.md`
  Purpose: operational guide for the cloud-only workflow, including the commands that intentionally avoid Docker.
- Modify: `README.md`
  Purpose: point contributors to the new Supabase workflow guide.

## Task 1: Add The Tracked Supabase CLI Command Surface

**Files:**
- Modify: `package.json`
- Modify: `.env.example`
- Test: `src/__tests__/config/supabase-cli-scripts.test.ts`

- [ ] **Step 1: Write the failing config test**

```ts
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("supabase cloud workflow config", () => {
  it("registers the Supabase CLI dependency and repo scripts", async () => {
    const { default: pkg } = await import("../../../package.json", {
      with: { type: "json" },
    });

    expect(pkg.devDependencies.supabase).toBeDefined();
    expect(pkg.scripts["supabase:init"]).toBe("supabase init");
    expect(pkg.scripts["supabase:login"]).toBe("tsx scripts/supabase-login.ts");
    expect(pkg.scripts["supabase:link"]).toBe("tsx scripts/supabase-link.ts");
    expect(pkg.scripts["supabase:migration:baseline"]).toBe(
      "tsx scripts/create-supabase-migration.ts baseline"
    );
    expect(pkg.scripts["supabase:migration:diff"]).toBe(
      "tsx scripts/create-supabase-migration.ts diff"
    );
    expect(pkg.scripts["supabase:migration:repair-latest"]).toBe(
      "tsx scripts/repair-latest-supabase-migration.ts applied"
    );
    expect(pkg.scripts["supabase:types"]).toBe("tsx scripts/generate-supabase-types.ts");
    expect(pkg.scripts["supabase:push:dry-run"]).toBe("supabase db push --linked --dry-run");
    expect(pkg.scripts["supabase:push"]).toBe("supabase db push --linked");
  });

  it("documents the non-committed Supabase workflow variables", async () => {
    const envExample = await readFile(new URL("../../../.env.example", import.meta.url), "utf8");

    expect(envExample).toContain('SUPABASE_PROJECT_REF=""');
    expect(envExample).toContain('SUPABASE_ACCESS_TOKEN=""');
    expect(envExample).toContain('SUPABASE_DB_PASSWORD=""');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test -- src/__tests__/config/supabase-cli-scripts.test.ts
```

Expected: FAIL because the `supabase` dependency, scripts, and env placeholders do not exist yet.

- [ ] **Step 3: Add the dependency, scripts, and env documentation**

Install the CLI with pnpm 10-compatible flags:

```bash
pnpm add supabase --save-dev --allow-build=supabase
```

Update `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "postinstall": "prisma generate",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:push": "prisma db push",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "supabase:init": "supabase init",
    "supabase:login": "tsx scripts/supabase-login.ts",
    "supabase:link": "tsx scripts/supabase-link.ts",
    "supabase:migration:baseline": "tsx scripts/create-supabase-migration.ts baseline",
    "supabase:migration:diff": "tsx scripts/create-supabase-migration.ts diff",
    "supabase:migration:repair-latest": "tsx scripts/repair-latest-supabase-migration.ts applied",
    "supabase:migration:list": "supabase migration list --linked",
    "supabase:push:dry-run": "supabase db push --linked --dry-run",
    "supabase:push": "supabase db push --linked",
    "supabase:types": "tsx scripts/generate-supabase-types.ts"
  },
  "devDependencies": {
    "supabase": "^2.49.10"
  }
}
```

Append these lines to `.env.example` after `DIRECT_URL`:

```dotenv
# Supabase CLI cloud workflow (do not commit real values)
SUPABASE_PROJECT_REF=""
SUPABASE_ACCESS_TOKEN=""
SUPABASE_DB_PASSWORD=""
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
pnpm test -- src/__tests__/config/supabase-cli-scripts.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml .env.example src/__tests__/config/supabase-cli-scripts.test.ts
git commit -m "chore: add Supabase CLI workflow scripts"
```

## Task 2: Add Docker-Free Supabase Workflow Helpers

**Files:**
- Create: `scripts/supabase-login.ts`
- Create: `scripts/supabase-link.ts`
- Create: `scripts/create-supabase-migration.ts`
- Create: `scripts/repair-latest-supabase-migration.ts`
- Create: `scripts/generate-supabase-types.ts`
- Test: `src/__tests__/scripts/supabase-workflow-helpers.test.ts`

- [ ] **Step 1: Write the failing helper-script tests**

```ts
import { describe, expect, it } from "vitest";
import { buildMigrationArgs, buildMigrationFilePath, sanitizeMigrationName } from "../../../scripts/create-supabase-migration";
import { buildTypegenArgs, OUTPUT_PATH } from "../../../scripts/generate-supabase-types";
import { getLatestMigrationVersion } from "../../../scripts/repair-latest-supabase-migration";
import { buildLoginArgs } from "../../../scripts/supabase-login";
import { buildLinkArgs } from "../../../scripts/supabase-link";

describe("supabase workflow helpers", () => {
  it("builds login args from the personal access token", () => {
    expect(buildLoginArgs("sbp_token")).toEqual(["login", "--token", "sbp_token"]);
  });

  it("builds link args from project ref and optional password", () => {
    expect(buildLinkArgs("abcd1234")).toEqual(["link", "--project-ref", "abcd1234"]);
    expect(buildLinkArgs("abcd1234", "secret")).toEqual([
      "link",
      "--project-ref",
      "abcd1234",
      "--password",
      "secret",
    ]);
  });

  it("generates deterministic baseline diff args", () => {
    expect(
      buildMigrationArgs({
        mode: "baseline",
        schemaPath: "prisma/schema.prisma",
        outputPath: "supabase/migrations/20260419000100_init_public_schema.sql",
      })
    ).toEqual([
      "prisma",
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--script",
      "--output",
      "supabase/migrations/20260419000100_init_public_schema.sql",
    ]);
  });

  it("generates diff args from the direct database url", () => {
    expect(
      buildMigrationArgs({
        mode: "diff",
        schemaPath: "prisma/schema.prisma",
        databaseUrl: "postgresql://direct-url",
        outputPath: "supabase/migrations/20260419001000_add_student_profile_columns.sql",
      })
    ).toEqual([
      "prisma",
      "migrate",
      "diff",
      "--from-url",
      "postgresql://direct-url",
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--script",
      "--output",
      "supabase/migrations/20260419001000_add_student_profile_columns.sql",
    ]);
  });

  it("sanitizes migration names into predictable sql file names", () => {
    expect(sanitizeMigrationName("Add Student Profile Columns")).toBe("add_student_profile_columns");
    expect(buildMigrationFilePath("Add Student Profile Columns", "20260419001000")).toBe(
      "supabase/migrations/20260419001000_add_student_profile_columns.sql"
    );
  });

  it("finds the latest migration version from local filenames", () => {
    expect(
      getLatestMigrationVersion([
        "20260419000100_init_public_schema.sql",
        "20260419001000_add_student_profile_columns.sql",
      ])
    ).toBe("20260419001000");
  });

  it("uses the linked type generation command and output path", () => {
    expect(buildTypegenArgs()).toEqual([
      "gen",
      "types",
      "typescript",
      "--linked",
      "--schema",
      "public",
    ]);
    expect(OUTPUT_PATH).toBe("src/types/supabase-database.ts");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
pnpm test -- src/__tests__/scripts/supabase-workflow-helpers.test.ts
```

Expected: FAIL because the helper scripts do not exist yet.

- [ ] **Step 3: Implement the helper scripts**

Create `scripts/supabase-login.ts`:

```ts
import { execFileSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { pathToFileURL } from "node:url";

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
  execFileSync("supabase", buildLoginArgs(requireEnv("SUPABASE_ACCESS_TOKEN")), {
    stdio: "inherit",
  });
}
```

Create `scripts/supabase-link.ts`:

```ts
import { execFileSync } from "node:child_process";
import { loadEnvConfig } from "@next/env";
import { pathToFileURL } from "node:url";

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

  execFileSync("supabase", buildLinkArgs(projectRef, dbPassword), { stdio: "inherit" });
}
```

Create `scripts/create-supabase-migration.ts`:

```ts
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { pathToFileURL } from "node:url";

loadEnvConfig(process.cwd());

type MigrationMode = "baseline" | "diff";

type BuildMigrationArgsInput = {
  mode: MigrationMode;
  schemaPath: string;
  outputPath: string;
  databaseUrl?: string;
};

export function sanitizeMigrationName(name: string) {
  const sanitized = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

  if (!sanitized) {
    throw new Error("Migration name must contain letters or numbers.");
  }

  return sanitized;
}

export function buildMigrationFilePath(name: string, timestamp: string) {
  return join("supabase", "migrations", `${timestamp}_${sanitizeMigrationName(name)}.sql`);
}

export function buildMigrationArgs({ mode, schemaPath, outputPath, databaseUrl }: BuildMigrationArgsInput) {
  if (mode === "baseline") {
    return [
      "prisma",
      "migrate",
      "diff",
      "--from-empty",
      "--to-schema-datamodel",
      schemaPath,
      "--script",
      "--output",
      outputPath,
    ];
  }

  if (!databaseUrl) {
    throw new Error("DIRECT_URL or DATABASE_URL is required for diff migrations.");
  }

  return [
    "prisma",
    "migrate",
    "diff",
    "--from-url",
    databaseUrl,
    "--to-schema-datamodel",
    schemaPath,
    "--script",
    "--output",
    outputPath,
  ];
}

function parseTimestamp(args: string[]) {
  const index = args.indexOf("--timestamp");
  return index === -1 ? new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14) : args[index + 1];
}

function resolvePackageManagerCommand() {
  return process.platform === "win32" ? "pnpm.cmd" : "pnpm";
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] as MigrationMode | undefined;
  const name = process.argv[3];

  if (mode !== "baseline" && mode !== "diff") {
    throw new Error("Usage: tsx scripts/create-supabase-migration.ts <baseline|diff> <name> [--timestamp YYYYMMDDHHMMSS]");
  }

  if (!name) {
    throw new Error("Migration name is required.");
  }

  const timestamp = parseTimestamp(process.argv.slice(4));
  const outputPath = buildMigrationFilePath(name, timestamp);
  const databaseUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  mkdirSync(join("supabase", "migrations"), { recursive: true });

  execFileSync(
    resolvePackageManagerCommand(),
    buildMigrationArgs({
      mode,
      schemaPath: "prisma/schema.prisma",
      outputPath,
      databaseUrl,
    }),
    { stdio: "inherit" }
  );

  console.log(`Created migration at ${outputPath}`);
}
```

Create `scripts/repair-latest-supabase-migration.ts`:

```ts
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export function getLatestMigrationVersion(files: string[]) {
  const sqlFiles = files.filter((file) => /^\d{14}_.+\.sql$/.test(file)).sort();

  if (sqlFiles.length === 0) {
    throw new Error("No Supabase migration files were found.");
  }

  return sqlFiles.at(-1)!.slice(0, 14);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const status = process.argv[2] ?? "applied";
  const version = getLatestMigrationVersion(readdirSync(join("supabase", "migrations")));

  execFileSync(
    "supabase",
    ["migration", "repair", version, "--status", status, "--linked"],
    { stdio: "inherit" }
  );

  console.log(`Repaired linked migration history for ${version} as ${status}`);
}
```

Create `scripts/generate-supabase-types.ts`:

```ts
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

export const OUTPUT_PATH = "src/types/supabase-database.ts";

export function buildTypegenArgs() {
  return ["gen", "types", "typescript", "--linked", "--schema", "public"];
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const output = execFileSync("supabase", buildTypegenArgs(), { encoding: "utf8" });

  mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, output);

  console.log(`Wrote ${OUTPUT_PATH}`);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test -- src/__tests__/scripts/supabase-workflow-helpers.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/supabase-login.ts scripts/supabase-link.ts scripts/create-supabase-migration.ts scripts/repair-latest-supabase-migration.ts scripts/generate-supabase-types.ts src/__tests__/scripts/supabase-workflow-helpers.test.ts
git commit -m "feat: add Supabase cloud workflow helpers"
```

## Task 3: Bootstrap The Hosted Project Baseline And Generated Types

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260419000100_init_public_schema.sql`
- Create: `src/types/supabase-database.ts`

- [ ] **Step 1: Initialize the tracked Supabase workspace**

Run:

```bash
pnpm supabase:init
```

Expected: PASS with `Finished supabase init.` and a new `supabase/config.toml` file.

- [ ] **Step 2: Log into the Supabase CLI with a personal access token**

Run:

```bash
pnpm supabase:login
```

Expected: PASS with `Finished supabase login.`

- [ ] **Step 3: Link the repo to the hosted project**

Run:

```bash
pnpm supabase:link
```

Expected: PASS with `Finished supabase link.`

- [ ] **Step 4: Generate the deterministic baseline migration from Prisma**

Run:

```bash
pnpm supabase:migration:baseline -- init_public_schema --timestamp 20260419000100
```

Expected: PASS with `Created migration at supabase/migrations/20260419000100_init_public_schema.sql`

The generated SQL file should now exist at:

```sql
supabase/migrations/20260419000100_init_public_schema.sql
```

- [ ] **Step 5: Mark the baseline migration as already applied on the linked project**

Run:

```bash
pnpm supabase:migration:repair-latest
```

Expected: PASS with both the Supabase CLI repair output and `Repaired linked migration history for 20260419000100 as applied`.

- [ ] **Step 6: Generate typed definitions from the linked hosted database**

Run:

```bash
pnpm supabase:types
```

Expected: PASS with `Wrote src/types/supabase-database.ts`

- [ ] **Step 7: Verify the linked migration and type state**

Run:

```bash
pnpm supabase:migration:list && pnpm supabase:push:dry-run
```

Expected:
- `supabase migration list --linked` shows `20260419000100` in both local and remote columns.
- `supabase db push --linked --dry-run` reports that the linked project is up to date or has no pending migrations.

- [ ] **Step 8: Commit**

```bash
git add supabase/config.toml supabase/migrations/20260419000100_init_public_schema.sql src/types/supabase-database.ts
git commit -m "chore: baseline hosted Supabase schema"
```

## Task 4: Type The Supabase Clients And Document The Workflow

**Files:**
- Modify: `src/lib/supabase/client.ts`
- Modify: `src/lib/supabase/server.ts`
- Modify: `src/lib/supabase/middleware.ts`
- Create: `src/__tests__/config/supabase-client-typing.test.ts`
- Create: `supabase/README.md`
- Modify: `README.md`

- [ ] **Step 1: Write the failing typing test**

```ts
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("supabase client typing", () => {
  it("threads the generated Database type through all Supabase clients", async () => {
    const [clientFile, serverFile, middlewareFile] = await Promise.all([
      readFile(new URL("../../../src/lib/supabase/client.ts", import.meta.url), "utf8"),
      readFile(new URL("../../../src/lib/supabase/server.ts", import.meta.url), "utf8"),
      readFile(new URL("../../../src/lib/supabase/middleware.ts", import.meta.url), "utf8"),
    ]);

    expect(clientFile).toContain('import type { Database } from "@/types/supabase-database";');
    expect(clientFile).toContain("createBrowserClient<Database>(");
    expect(serverFile).toContain('import type { Database } from "@/types/supabase-database";');
    expect(serverFile).toContain("createServerClient<Database>(");
    expect(middlewareFile).toContain('import type { Database } from "@/types/supabase-database";');
    expect(middlewareFile).toContain("createServerClient<Database>(");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
pnpm test -- src/__tests__/config/supabase-client-typing.test.ts
```

Expected: FAIL because the Supabase clients do not import the generated type yet.

- [ ] **Step 3: Thread the generated type through all Supabase client factories**

Update `src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase-database";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Update `src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/supabase-database";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if middleware refreshes user sessions.
          }
        },
      },
    }
  );
}
```

Update `src/lib/supabase/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase-database";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return supabaseResponse;
}
```

Create `supabase/README.md`:

```md
# Supabase Cloud Workflow

This repo uses a single hosted Supabase project on the free tier.

## One-time setup

1. Copy `.env.example` to `.env.local` and fill `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, and `SUPABASE_DB_PASSWORD`.
2. Run `pnpm supabase:init`.
3. Run `pnpm supabase:login`.
4. Run `pnpm supabase:link`.

## Prisma-owned schema changes

1. Edit `prisma/schema.prisma`.
2. Run `pnpm supabase:migration:diff -- your_change_name`.
3. Review the SQL created in `supabase/migrations/`.
4. Run `pnpm supabase:push:dry-run`.
5. Run `pnpm supabase:push`.
6. Run `pnpm supabase:types`.

## Commands intentionally avoided in this workflow

- `supabase db pull`
- `supabase db diff --linked`

Those commands rely on Docker-backed tooling. This workflow uses `prisma migrate diff` instead.
```

Append this section to `README.md` after the Getting Started block:

```md
## Supabase Workflow

The project uses a single hosted Supabase project with Git-tracked SQL migrations under `supabase/`.

See `supabase/README.md` for the cloud-only workflow, including the helper commands that avoid Docker-dependent schema pull and diff flows.
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
pnpm test -- src/__tests__/config/supabase-client-typing.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run the relevant verification commands**

Run:

```bash
pnpm test -- src/__tests__/config/supabase-cli-scripts.test.ts src/__tests__/scripts/supabase-workflow-helpers.test.ts src/__tests__/config/supabase-client-typing.test.ts && pnpm lint
```

Expected: PASS for all three targeted tests and ESLint.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase/client.ts src/lib/supabase/server.ts src/lib/supabase/middleware.ts src/__tests__/config/supabase-client-typing.test.ts supabase/README.md README.md
git commit -m "refactor: type Supabase clients and document workflow"
```

## Self-Review

- Spec coverage:
  - Ownership split is implemented by keeping Prisma schema changes in `prisma/schema.prisma`, routing tracked SQL into `supabase/migrations`, and documenting the boundary in `supabase/README.md`.
  - Agent-safe CLI access is implemented through helper scripts and deterministic repo commands.
  - Single hosted-project baselining is covered by the baseline migration, repair step, and linked-project verification.
  - Typed client integration is covered by generated types plus generics in all Supabase client factories.
- Placeholder scan: removed dynamic timestamp ambiguity by making the baseline migration deterministic with `--timestamp 20260419000100`.
- Type consistency: all client factories import the same `Database` type from `@/types/supabase-database`.
