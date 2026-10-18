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
    <div className="mx-auto max-w-5xl">
      <header className="mb-7">
        <p className="font-display text-[15px] font-semibold uppercase tracking-[0.18em] text-yellow-text">
          Solicitud de servicio
        </p>
        <h1 className="mt-1.5 font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-6xl">
          Nuevo pedido
        </h1>
        <p className="mt-2.5 text-base text-muted">
          Cuéntanos qué necesita tu coche. Te mandamos la cotización sin compromiso.
        </p>
      </header>

      <NewOrderForm services={services ?? []} />
    </div>
  );
}
