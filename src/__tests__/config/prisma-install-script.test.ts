import { describe, expect, it } from "vitest";

describe("package install scripts", () => {
  it("regenerates Prisma Client after dependencies install", async () => {
    const { default: pkg } = await import("../../../package.json", {
      with: { type: "json" },
    });

    expect(pkg.scripts.postinstall).toBe("prisma generate");
  });
});
