import { createClient } from "@/lib/supabase/server";
import { Tag } from "lucide-react";

export default async function PortalCuponesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: isFrequent } = await supabase.rpc("is_frequent_client", {
    p_client_id: user.id,
  });

  const audienceFilter = isFrequent ? ["frecuentes", "ambos"] : ["clientes", "ambos"];

  const [{ data: coupons }, { data: redemptions }] = await Promise.all([
    supabase
      .from("coupons")
      .select("id, title, description, discount_type, discount_value, services(title)")
      .eq("is_active", true)
      .in("audience", audienceFilter),
    supabase.from("coupon_redemptions").select("coupon_id").eq("client_id", user.id),
  ]);

  const usedIds = new Set(redemptions?.map((r) => r.coupon_id) ?? []);
  const availableCoupons = coupons?.filter((c) => !usedIds.has(c.id)) ?? [];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Mis cupones
      </h1>
      <p className="mb-8 text-sm text-muted">
        {isFrequent
          ? "Gracias por ser cliente frecuente — estos son tus cupones disponibles."
          : "Estos son los cupones que puedes usar en tu próximo pedido."}
      </p>

      {availableCoupons.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-10 text-center dark:border-white/15">
          <Tag size={24} className="mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">
            No tienes cupones disponibles por ahora. Síguenos en Facebook para
            enterarte de nuevos descuentos.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {availableCoupons.map((c) => {
            const service = (c.services as unknown as { title: string } | null)?.title;
            const discountLabel =
              c.discount_type === "percentage"
                ? `${c.discount_value}% de descuento`
                : `$${c.discount_value.toLocaleString("es-MX")} de descuento`;

            return (
              <div
                key={c.id}
                className="rounded-lg border border-brand-yellow/40 bg-brand-yellow/10 p-4"
              >
                <p className="font-semibold text-foreground">{c.title}</p>
                <p className="mt-0.5 text-sm text-brand-yellow-dark dark:text-brand-yellow">
                  {discountLabel}
                </p>
                {c.description ? (
                  <p className="mt-1 text-xs text-muted">{c.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-muted">
                  Válido en: {service ?? "cualquier servicio"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}