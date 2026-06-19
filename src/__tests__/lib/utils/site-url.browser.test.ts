import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getSiteUrl } from "@/lib/utils/site-url";

describe("getSiteUrl (browser)", () => {
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

  it("prefers NEXT_PUBLIC_SITE_URL over window.location.origin", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://public.example.com";

    expect(getSiteUrl()).not.toBe(window.location.origin);
    expect(getSiteUrl()).toBe("https://public.example.com");
  });

  it("falls back to window.location.origin when NEXT_PUBLIC_SITE_URL is not set", () => {
    expect(getSiteUrl()).toBe(window.location.origin);
  });
});
