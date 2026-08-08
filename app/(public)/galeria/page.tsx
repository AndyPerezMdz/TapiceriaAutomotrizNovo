import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Galería | Tapicería Automotriz by NOVO",
};

export default async function GaleriaPage() {
  const supabase = await createClient();

  const [{ data: services }, { data: items }] = await Promise.all([
    supabase
      .from("services")
      .select("id, slug, title")
      .eq("is_active", true)
      .order("order", { ascending: true }),
    supabase
      .from("gallery_items")
      .select("id, service_id, image_before_url, image_after_url, caption")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Galería de trabajos
        </h1>
        <p className="mt-3 text-muted">
          Antes y después de algunos de nuestros trabajos realizados.
        </p>
      </div>

      <GalleryGrid services={services ?? []} items={items ?? []} />
    </div>
  );
}