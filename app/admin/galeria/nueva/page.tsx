import { GalleryItemForm } from "@/components/admin/GalleryItemForm";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NuevaFotoGaleriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (myProfile?.role !== "admin") {
    redirect("/admin/galeria");
  }

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