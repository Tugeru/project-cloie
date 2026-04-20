import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, expectTypeOf, it } from "vitest";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient as createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase-database";

function parseSourceFile(filePath: string, sourceText: string) {
  return ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

function hasDatabaseTypeImport(sourceFile: ts.SourceFile) {
  return sourceFile.statements.some((statement) => {
    if (!ts.isImportDeclaration(statement) || statement.moduleSpecifier.getText(sourceFile) !== '"@/types/supabase-database"') {
      return false;
    }

    const namedBindings = statement.importClause?.namedBindings;

    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      return false;
    }

    return namedBindings.elements.some(
      (element) => element.name.text === "Database" && (statement.importClause?.isTypeOnly || element.isTypeOnly)
    );
  });
}

function hasTypedSupabaseFactoryCall(sourceFile: ts.SourceFile, factoryName: string) {
  let found = false;

  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === factoryName &&
      node.typeArguments?.length === 1 &&
      node.typeArguments[0]?.getText(sourceFile) === "Database"
    ) {
      found = true;
      return;
    }

    ts.forEachChild(node, visit);
  };

  ts.forEachChild(sourceFile, visit);

  return found;
}

describe("supabase client typing", () => {
  it("returns Database-typed browser and server clients", () => {
    expectTypeOf<ReturnType<typeof createBrowserClient>>().toMatchTypeOf<SupabaseClient<Database>>();
    expectTypeOf<Awaited<ReturnType<typeof createServerClient>>>().toMatchTypeOf<SupabaseClient<Database>>();
  });

  it("threads the generated Database type through all Supabase client factories", async () => {
    const [clientFile, serverFile, middlewareFile] = await Promise.all([
      readFile(path.join(process.cwd(), "src/lib/supabase/client.ts"), "utf8"),
      readFile(path.join(process.cwd(), "src/lib/supabase/server.ts"), "utf8"),
      readFile(path.join(process.cwd(), "src/lib/supabase/middleware.ts"), "utf8"),
    ]);

    const clientSourceFile = parseSourceFile("client.ts", clientFile);
    const serverSourceFile = parseSourceFile("server.ts", serverFile);
    const middlewareSourceFile = parseSourceFile("middleware.ts", middlewareFile);

    expect(hasDatabaseTypeImport(clientSourceFile)).toBe(true);
    expect(hasTypedSupabaseFactoryCall(clientSourceFile, "createBrowserClient")).toBe(true);
    expect(hasDatabaseTypeImport(serverSourceFile)).toBe(true);
    expect(hasTypedSupabaseFactoryCall(serverSourceFile, "createServerClient")).toBe(true);
    expect(hasDatabaseTypeImport(middlewareSourceFile)).toBe(true);
    expect(hasTypedSupabaseFactoryCall(middlewareSourceFile, "createServerClient")).toBe(true);
  });

  it("documents the correct repo and env workflow", async () => {
    const [projectReadme, supabaseReadme] = await Promise.all([
      readFile(path.join(process.cwd(), "README.md"), "utf8"),
      readFile(path.join(process.cwd(), "supabase/README.md"), "utf8"),
    ]);

    expect(supabaseReadme).toContain("If you need to initialize a fresh clone of the repo metadata, run `pnpm supabase:init` once.");
    expect(supabaseReadme).toContain("`NEXT_PUBLIC_SUPABASE_URL`");
    expect(supabaseReadme).toContain("`NEXT_PUBLIC_SUPABASE_ANON_KEY`");
    expect(supabaseReadme).toContain("`SUPABASE_PROJECT_REF`");
    expect(supabaseReadme).toContain("`SUPABASE_ACCESS_TOKEN`");
    expect(supabaseReadme).toContain("`SUPABASE_DB_PASSWORD`");

    expect(projectReadme).toContain("`NEXT_PUBLIC_SUPABASE_URL`");
    expect(projectReadme).toContain("`NEXT_PUBLIC_SUPABASE_ANON_KEY`");
    expect(projectReadme).toContain("`SUPABASE_PROJECT_REF`");
  });
});
