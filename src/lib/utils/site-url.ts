const DEFAULT_DEV_URL = "http://localhost:3000";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * Returns the canonical public site URL.
 *
 * Order of precedence:
 * 1. `NEXT_PUBLIC_SITE_URL` (if set)
 * 2. In the browser: `window.location.origin`
 * 3. An explicit fallback origin (typically from `request.url`)
 * 4. `http://localhost:3000` as a last resort
 */
export function getSiteUrl(fallbackOrigin?: string): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (envUrl) {
    return trimTrailingSlash(envUrl);
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (fallbackOrigin) {
    return trimTrailingSlash(fallbackOrigin);
  }

  return DEFAULT_DEV_URL;
}
