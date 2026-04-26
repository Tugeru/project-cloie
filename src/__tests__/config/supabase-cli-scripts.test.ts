import { access, readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("Supabase CLI config", () => {
  it("tracks the CLI dependency, scripts, and cloud workflow env placeholders", async () => {
    const [{ default: pkg }, envExample] = await Promise.all([
      import("../../../package.json", { with: { type: "json" } }),
      readFile(path.join(process.cwd(), ".env.example"), "utf8"),
    ]);

    const scriptEntryFiles = Object.values(pkg.scripts)
      .filter((script): script is string => typeof script === "string")
      .filter((script) => script.startsWith("tsx scripts/"))
      .map((script) => script.slice("tsx ".length).split(" ")[0]);

    await Promise.all(scriptEntryFiles.map((file) => access(path.join(process.cwd(), file))));

    expect(pkg.devDependencies.supabase).toBeDefined();

    expect(pkg.scripts["supabase:init"]).toBe("tsx scripts/run-supabase-command.ts init");
    expect(pkg.scripts["supabase:login"]).toBe("tsx scripts/supabase-login.ts");
    expect(pkg.scripts["supabase:link"]).toBe("tsx scripts/supabase-link.ts");
    expect(pkg.scripts["supabase:migration:baseline"]).toBe(
      "tsx scripts/create-supabase-migration.ts baseline"
    );
    expect(pkg.scripts["supabase:migration:diff"]).toBe(
      "tsx scripts/create-supabase-migration.ts diff"
    );
    expect(pkg.scripts["supabase:migration:list"]).toBe(
      "tsx scripts/run-supabase-command.ts migration list --linked"
    );
    expect(pkg.scripts["supabase:migration:repair-latest"]).toBe(
      "tsx scripts/repair-latest-supabase-migration.ts applied"
    );
    expect(pkg.scripts["supabase:types"]).toBe("tsx scripts/generate-supabase-types.ts");
    expect(pkg.scripts["supabase:push:dry-run"]).toBe(
      "tsx scripts/run-supabase-command.ts db push --linked --dry-run"
    );
    expect(pkg.scripts["supabase:push"]).toBe(
      "tsx scripts/run-supabase-command.ts db push --linked"
    );

    expect(envExample).toContain('SUPABASE_PROJECT_REF=""');
    expect(envExample).toContain('SUPABASE_ACCESS_TOKEN=""');
    expect(envExample).toContain('SUPABASE_DB_PASSWORD=""');
  });
});
