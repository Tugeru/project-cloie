import { createRequire } from "module";

// Load the plugin via createRequire so that the lookup starts from
// postcss.config.mjs's own directory (project root), not from whatever
// directory Next.js/Turbopack happens to use as its working directory.
const projectRequire = createRequire(import.meta.url);

const config = {
  plugins: [projectRequire("@tailwindcss/postcss")],
};

export default config;
