import { ServiceForm } from "@/components/admin/ServiceForm";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { ServiceMaterialsManager } from "@/components/admin/ServiceMaterialsManager";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarServicioPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  if (!service) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Editar servicio
      </h1>
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