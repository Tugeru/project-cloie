import { describe, expect, it } from "vitest";

describe("postcss config", () => {
  it("references Tailwind by package name instead of eagerly requiring it", async () => {
    const { default: config } = await import("../../../postcss.config.mjs");

    expect(config.plugins).toEqual(["@tailwindcss/postcss"]);
  });
});
