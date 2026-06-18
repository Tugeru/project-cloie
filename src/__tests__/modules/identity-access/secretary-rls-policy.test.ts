import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSupabaseMigrationsDir(): string {
  // __dirname is src/__tests__/modules/identity-access/ -> walk up four levels
  return join(__dirname, "..", "..", "..", "..", "supabase", "migrations");
}

function listMigrationFiles(): string[] {
  const dir = readSupabaseMigrationsDir();
  return readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort(); // chronological order via timestamped prefixes
}

function readMigrationContent(filename: string): string {
  const dir = readSupabaseMigrationsDir();
  const path = join(dir, filename);
  if (!existsSync(path)) {
    return "";
  }
  return readFileSync(path, "utf-8");
}

/**
 * Replays the append-only migration ledger in chronological order and returns
 * the body of the LAST `CREATE POLICY "Enable write access for secretary only"`
 * statement targeting the given table. This mirrors how Postgres itself reaches
 * the live state: older migrations create the policy, newer migrations DROP+reCREATE
 * it. Only the most recent CREATE definition survives in the live database.
 */
function latestCreatePolicyBody(
  table: "school_years" | "academic_term_instances"
): string {
  const files = listMigrationFiles();
  let last: string = "";
  for (const f of files) {
    const content = readMigrationContent(f);
    const re = new RegExp(
      `CREATE POLICY "Enable write access for secretary only"\\s+ON\\s+${table}[\\s\\S]*?\\);\\s*$`,
      "m"
    );
    const matches = content.match(re);
    if (matches && matches.length > 0) {
      last = matches[matches.length - 1];
    }
  }
  return last;
}

describe("Secretary RLS policy: migration ledger integrity (always runs)", () => {
  // Static guard: verify the migration ledger's FINAL state for both secretary-only
  // RLS policies uses `u.auth_user_id = auth.uid()` (the column that holds the
  // Supabase Auth UUID) and NOT `u.id = auth.uid()` (the public.users PK, which is
  // a separate gen_random_uuid() UUID).
  //
  // Background: the original rename migration 20260618124311 copied `u.id = auth.uid()`
  // from the legacy 20260510003018 admin-only policy, but `auth.uid()` returns the
  // auth UUID (stored in `User.auth_user_id`), not the public-users PK. The fix
  // lives in 20260618153711_fix_secretary_rls_user_join.sql, which DROPs and re-CREATEs
  // both policies with the corrected join. Because migrations are append-only ledger
  // history, this test replays them in chronological order and asserts the FINAL shape.

  it("school_years secretary policy uses u.auth_user_id = auth.uid() (not u.id)", () => {
    const body = latestCreatePolicyBody("school_years");
    expect(
      body,
      "expected a CREATE POLICY 'Enable write access for secretary only' ON school_years somewhere in the migration ledger"
    ).not.toBe("");
    expect(body).toContain("FOR ALL TO authenticated");
    expect(body).toContain("USING (");
    expect(body).toContain("WITH CHECK (");
    expect(body).toContain("ur.role = 'SECRETARY'");
    expect(body).toContain("u.auth_user_id = auth.uid()");
    expect(
      body.includes("u.id = auth.uid()"),
      "final 'Enable write access for secretary only' ON school_years must NOT use the wrong join u.id = auth.uid()"
    ).toBe(false);
  });

  it("academic_term_instances secretary policy uses u.auth_user_id = auth.uid() (not u.id)", () => {
    const body = latestCreatePolicyBody("academic_term_instances");
    expect(
      body,
      "expected a CREATE POLICY 'Enable write access for secretary only' ON academic_term_instances somewhere in the migration ledger"
    ).not.toBe("");
    expect(body).toContain("FOR ALL TO authenticated");
    expect(body).toContain("USING (");
    expect(body).toContain("WITH CHECK (");
    expect(body).toContain("ur.role = 'SECRETARY'");
    expect(body).toContain("u.auth_user_id = auth.uid()");
    expect(
      body.includes("u.id = auth.uid()"),
      "final 'Enable write access for secretary only' ON academic_term_instances must NOT use the wrong join u.id = auth.uid()"
    ).toBe(false);
  });

  it("fix migration file re-creates both secretary policies with the corrected join", () => {
    const fixFile = "20260618153711_fix_secretary_rls_user_join.sql";
    const expectedPath = join(readSupabaseMigrationsDir(), fixFile);
    expect(
      existsSync(expectedPath),
      `expected the RLS fix migration at ${expectedPath}`
    ).toBe(true);

    const content = readMigrationContent(fixFile);
    expect(content).toContain(
      `DROP POLICY IF EXISTS "Enable write access for secretary only" ON school_years;`
    );
    expect(content).toContain(
      `DROP POLICY IF EXISTS "Enable write access for secretary only" ON academic_term_instances;`
    );
    // Inspect just the CREATE POLICY statements (not the SQL comments which
    // legitimately reference the broken pattern they're describing).
    const createStatements =
      content.match(
        /CREATE POLICY "Enable write access for secretary only"[\s\S]*?\);/g
      ) || [];
    expect(createStatements.length).toBe(2);
    for (const stmt of createStatements) {
      expect(stmt).not.toContain("u.id = auth.uid()");
      expect(stmt).toContain("u.auth_user_id = auth.uid()");
    }
  });
});

describe("Secretary RLS Policies (live DB behavior)", () => {
  // TODO(prd-1 follow-up): These tests are intentionally skipped because verifying RLS
  // behavior at runtime requires:
  //   1. An authenticated Supabase client carrying a real JWT with a SECRETARY role claim.
  //   2. A second authenticated client with a non-SECRETARY role for the negative path.
  // The anon key does NOT exercise the `TO authenticated` clause — anon gets
  // `42501 permission denied for schema public` (a Postgres USAGE privilege error,
  // not an RLS denial).
  //
  // The migration-ledger integrity tests above are the currently-meaningful guard.
  // Restore these as live tests when an authenticated test-user harness is in place.

  it.skip("SECRETARY role can write to school_years", async () => {});

  it.skip("SECRETARY role can write to academic_term_instances", async () => {});

  it.skip("Non-SECRETARY roles are denied writes to school_years", async () => {});

  it.skip("RLS policy definitions do not contain literal 'ADMIN'", async () => {});
});
