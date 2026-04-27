import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("mobile nav component boundary", () => {
  it("is marked as a client component because it defines click handlers", async () => {
    const source = await readFile(
      path.resolve(process.cwd(), "src/components/layout/mobile-nav.tsx"),
      "utf8"
    );

    expect(source.startsWith('"use client";')).toBe(true);
  });
});
