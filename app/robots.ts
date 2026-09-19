import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.ANYMD_APP_URL?.trim() || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/login", "/signup", "/clarify", "/skills", "/generate"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
