import type { MetadataRoute } from "next";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Private or personal pages (they also have "noindex").
      disallow: ["/admin", "/api/", "/en/cart", "/uk/cart", "/en/checkout/", "/uk/checkout/"],
    },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
