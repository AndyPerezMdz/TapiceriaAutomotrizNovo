import { NewOrderForm } from "@/components/portal/NewOrderForm";
import { createClient } from "@/lib/supabase/server";

export default async function NuevoPedidoPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, slug, title")
    .eq("is_active", true)
    .order("order", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Solicitar cotización
        </h1>
        <p className="mt-1 text-sm text-muted">
          Cuéntanos qué necesitas y, si quieres, adjunta fotos del estado actual.
        </p>
      </div>

      <NewOrderForm services={services ?? []} />
    </div>
  );
}