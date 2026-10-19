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
    <div className="mx-auto max-w-6xl px-6 pb-20 pt-14 sm:pb-24 sm:pt-16">
      <header className="mb-8 animate-fade-up">
        <p className="font-display text-[15px] font-semibold uppercase tracking-[0.2em] text-yellow-text">
          Antes y después
        </p>
        <h1 className="mt-2.5 font-display text-6xl font-extrabold uppercase leading-[0.9] text-foreground sm:text-[88px]">
          Galería
        </h1>
        <p className="mt-3.5 max-w-xl text-[17px] leading-relaxed text-muted sm:text-lg">
          Desliza la línea de cada foto para ver cómo llegó el coche y cómo se fue.
        </p>
      </header>

      <GalleryGrid services={services ?? []} items={items ?? []} />
    </div>
  );
}
