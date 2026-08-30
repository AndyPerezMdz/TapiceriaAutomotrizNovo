import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://tapiceriaautomotrizbynovo.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/admin", "/api", "/login", "/registro", "/staff"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}