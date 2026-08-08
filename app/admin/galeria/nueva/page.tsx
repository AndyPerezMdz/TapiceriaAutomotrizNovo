import { GalleryItemForm } from "@/components/admin/GalleryItemForm";
import { createClient } from "@/lib/supabase/server";

export default async function NuevaFotoGaleriaPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, title")
    .eq("is_active", true)
    .order("order", { ascending: true });

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Agregar foto a galería
      </h1>
      <GalleryItemForm services={services ?? []} />
    </div>
  );
}