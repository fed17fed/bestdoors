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
  noExternal: ["@bestdoors/shared"],
});
