import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

// Resolve the project root from the config file's own location so that
// Turbopack's enhanced-resolve can find packages even when process.cwd()
// points to a parent workspace directory (common in pnpm mono-repos).
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // Pin tailwindcss to an absolute path so Turbopack's PostCSS worker
      // never tries to resolve it from an ancestor directory.
      tailwindcss: path.join(projectRoot, "node_modules", "tailwindcss"),
    },
  },
};

export default nextConfig;
