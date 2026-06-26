/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSiteUrl } from "@/lib/utils/site-url";

describe("getSiteUrl (server / no window)", () => {
  let originalSiteUrl: string | undefined;

  beforeEach(() => {
    originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  afterEach(() => {
    if (originalSiteUrl === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
    }
  });

  it("returns NEXT_PUBLIC_SITE_URL when set, stripping any trailing slash", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://cloie.example.com/";
    expect(getSiteUrl("https://fallback.example.com")).toBe("https://cloie.example.com");
  });

  it("falls back to the provided origin when NEXT_PUBLIC_SITE_URL is not set", () => {
    expect(getSiteUrl("https://request.example.com/")).toBe("https://request.example.com");
  });

  it("returns http://localhost:3000 as the final fallback", () => {
    expect(getSiteUrl()).toBe("http://localhost:3000");
  });
});
