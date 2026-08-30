import { createClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tapiceriaautomotrizbynovo.com";
  const supabase = await createClient();

  const { data: services } = await supabase
    .from("services")
    .select("slug")
    .eq("is_active", true);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1 },
    { url: `${baseUrl}/servicios`, priority: 0.9 },
    { url: `${baseUrl}/galeria`, priority: 0.7 },
    { url: `${baseUrl}/nosotros`, priority: 0.6 },
    { url: `${baseUrl}/contacto`, priority: 0.8 },
    { url: `${baseUrl}/privacidad`, priority: 0.3 },
    { url: `${baseUrl}/terminos`, priority: 0.3 },
  ];

  const serviceRoutes: MetadataRoute.Sitemap =
    services?.map((s) => ({
      url: `${baseUrl}/servicios/${s.slug}`,
      priority: 0.8,
    })) ?? [];

  return [...staticRoutes, ...serviceRoutes];
}