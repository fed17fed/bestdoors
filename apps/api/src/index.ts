import { createApp } from "./app";

// Vercel runs the exported Express app as one serverless function.
const app = createApp();
export default app;
