import { defineConfig } from "tsup";

// Bundles the API (and the workspace package @bestdoors/shared) into dist/.
export default defineConfig({
  entry: ["src/index.ts", "src/dev.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  outDir: "dist",
  clean: true,
  sourcemap: true,
  // sanitize-html (CommonJS) needs htmlparser2 12 (ESM only); Vercel's runtime cannot require() it, so we bundle both.
  noExternal: ["@bestdoors/shared", "sanitize-html", "htmlparser2"],
  banner: { js: 'import { createRequire as __cr } from "node:module"; const require = __cr(import.meta.url);' },
});
