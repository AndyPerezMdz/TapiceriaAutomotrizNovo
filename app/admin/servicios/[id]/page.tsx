import { ServiceForm } from "@/components/admin/ServiceForm";
import { ServiceImageUploader } from "@/components/admin/ServiceImageUploader";
import { ServiceMaterialsManager } from "@/components/admin/ServiceMaterialsManager";
import { createClient } from "@/lib/supabase/server";
import { ClipboardList, ImageIcon } from "lucide-react";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarServicioPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: service }, { count: ordersCount }, { count: galleryCount }] =
    await Promise.all([
      supabase.from("services").select("*").eq("id", id).single(),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("service_id", id)
        .is("deleted_at", null),
      supabase
        .from("gallery_items")
        .select("*", { count: "exact", head: true })
        .eq("service_id", id),
    ]);

  if (!service) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Editar servicio
        </h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            <ClipboardList size={13} /> {ordersCount ?? 0} pedidos
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
            <ImageIcon size={13} /> {galleryCount ?? 0} fotos
          </div>
        </div>
      </div>

      <div className="mb-8 max-w-xl">
        <ServiceImageUploader serviceId={service.id} currentImageUrl={service.image_url} />
      </div>

      <ServiceForm service={service} />

      <div className="mt-10 max-w-xl">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Materiales y colores
        </h2>
        <ServiceMaterialsManager serviceId={service.id} />
      </div>
    </div>
  );
}