import { ServiceForm } from "@/components/admin/ServiceForm";
import { ServiceImageUploader } from "@/components/admin/ServiceImageUploader";
import { ServiceMaterialsManager } from "@/components/admin/ServiceMaterialsManager";
import { ServiceStagesManager } from "@/components/admin/ServiceStagesManager";
import { ServiceStitchingManager } from "@/components/admin/ServiceStitchingManager";
import { createClient } from "@/lib/supabase/server";
import { ClipboardList, ImageIcon } from "lucide-react";
import { notFound, redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarServicioPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };

  if (myProfile?.role !== "admin") {
    redirect("/admin/servicios");
  }

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
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl text-foreground">
          Editar servicio
        </h1>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 rounded-full bg-brand-yellow text-ink px-3 py-1 text-[13px] font-medium">
            <ClipboardList size={13} /> {ordersCount ?? 0} pedidos
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-brand-yellow text-ink px-3 py-1 text-[13px] font-medium">
            <ImageIcon size={13} /> {galleryCount ?? 0} fotos
          </div>
        </div>
      </div>

      <div className="mb-8 max-w-xl">
        <ServiceImageUploader serviceId={service.id} currentImageUrl={service.image_url} />
      </div>

      <ServiceForm service={service} />

      <div className="mt-10 max-w-xl">
        <h2 className="font-display text-2xl font-bold uppercase mb-1 text-foreground">
          Etapas del proceso
        </h2>
        <p className="mb-4 text-[13px] text-muted">
          El cliente ve estas etapas mientras su pedido está &quot;En proceso&quot;. Puedes
          agregar, reordenar o desactivar etapas cuando cambie la forma de trabajar.
        </p>
        <ServiceStagesManager serviceId={service.id} />
      </div>

      <div className="mt-10 max-w-xl">
        <h2 className="font-display text-2xl font-bold uppercase mb-4 text-foreground">
          Materiales y colores
        </h2>
        <ServiceMaterialsManager serviceId={service.id} />
      </div>

      <div className="mt-10 max-w-xl">
        <h2 className="font-display text-2xl font-bold uppercase mb-4 text-foreground">
          Costura y colores
        </h2>
        <ServiceStitchingManager serviceId={service.id} />
      </div>
    </div>
  );
}