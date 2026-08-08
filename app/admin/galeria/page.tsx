import { GalleryAdminGrid } from "@/components/admin/GalleryAdminGrid";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminGaleriaPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("gallery_items")
    .select("id, image_before_url, image_after_url, caption")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Galería
        </h1>
        <Link
          href="/admin/galeria/nueva"
          className="flex items-center gap-1.5 rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
        >
          <Plus size={16} /> Agregar foto
        </Link>
      </div>

      <GalleryAdminGrid items={items ?? []} />
    </div>
  );
}