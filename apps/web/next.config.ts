import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const apiUrl = process.env.API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // E2E uses its own build folder (and so its own fetch cache), set in playwright.config.ts
  distDir: process.env.NEXT_DIST_DIR || ".next",
  transpilePackages: ["@bestdoors/shared"],
  // Browser calls /api/* on the same domain; Next.js forwards them to the Express API.
  // Same origin = simple, secure cookies (no CORS).
  // Ukrainian was removed (2026-11-07): old /uk/... links go to the English page.
  async redirects() {
    return [
      { source: "/uk", destination: "/en", permanent: true },
      { source: "/uk/:path*", destination: "/en/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default createNextIntlPlugin("./src/i18n/request.ts")(nextConfig);
