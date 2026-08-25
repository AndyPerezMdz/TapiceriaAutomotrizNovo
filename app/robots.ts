import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://tapiceria-automotriz-novo.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal", "/admin", "/api", "/login", "/registro", "/staff"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}