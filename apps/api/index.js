// Vercel entry: the ready bundle from `npm run build` (tsup, includes @bestdoors/shared).
// Vercel's own TypeScript compile of src/ fails on our workspace setup, so it gets plain JS.
import "express"; // lets Vercel detect this file as the Express app
export { default } from "./dist/index.js";
