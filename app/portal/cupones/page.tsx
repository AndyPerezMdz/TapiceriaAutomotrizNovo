import { createClient } from "@/lib/supabase/server";
import { Tag } from "lucide-react";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function PortalCuponesPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const activeTab = tab === "canjeados" || tab === "caducados" ? tab : "activos";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: isFrequent } = await supabase.rpc("is_frequent_client", {
    p_client_id: user.id,
  });

  const audienceFilter = isFrequent ? ["frecuentes", "ambos"] : ["clientes", "ambos"];
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: allCoupons }, { data: redemptions }] = await Promise.all([
    supabase
      .from("coupons")
      .select(
        "id, title, description, discount_type, discount_value, expires_at, services(title)",
      )
      .in("audience", audienceFilter),
    supabase.from("coupon_redemptions").select("coupon_id").eq("client_id", user.id),
  ]);

  const redeemedIds = new Set(redemptions?.map((r) => r.coupon_id) ?? []);

  const activos =
    allCoupons?.filter(
      (c) => !redeemedIds.has(c.id) && (!c.expires_at || c.expires_at >= today),
    ) ?? [];
  const canjeados = allCoupons?.filter((c) => redeemedIds.has(c.id)) ?? [];
  const caducados =
    allCoupons?.filter(
      (c) => !redeemedIds.has(c.id) && c.expires_at && c.expires_at < today,
    ) ?? [];

  const tabs = [
    { value: "activos", label: "Activos", items: activos },
    { value: "canjeados", label: "Canjeados", items: canjeados },
    { value: "caducados", label: "Caducados", items: caducados },
  ];

  const currentItems = tabs.find((t) => t.value === activeTab)?.items ?? [];

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">
        Mis cupones
      </h1>
      <p className="mb-6 text-sm text-muted">
        {isFrequent
          ? "Gracias por ser cliente frecuente — estos son tus cupones."
          : "Descuentos disponibles para tu próximo pedido."}
      </p>

      <div className="mb-6 flex gap-2">
        {tabs.map((t) => (
          <a
            key={t.value}
            href={`/portal/cupones?tab=${t.value}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeTab === t.value
                ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
                : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
            }`}
          >
            {t.label} ({t.items.length})
          </a>
        ))}
      </div>

      {currentItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-10 text-center dark:border-white/15">
          <Tag size={24} className="mx-auto mb-2 text-muted" />
          <p className="text-sm text-muted">
            {activeTab === "activos"
              ? "No tienes cupones disponibles por ahora."
              : activeTab === "canjeados"
                ? "Aún no has usado ningún cupón."
                : "No tienes cupones caducados."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentItems.map((c) => {
            const service = (c.services as unknown as { title: string } | null)?.title;
            const discountLabel =
              c.discount_type === "percentage"
                ? `${c.discount_value}% de descuento`
                : `$${c.discount_value.toLocaleString("es-MX")} de descuento`;

            return (
              <div
                key={c.id}
                className={`rounded-lg border p-4 ${
                  activeTab === "activos"
                    ? "border-brand-yellow/40 bg-brand-yellow/10"
                    : "border-black/10 bg-surface opacity-75 dark:border-white/10"
                }`}
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
                  {c.expires_at
                    ? ` · Vence ${new Date(`${c.expires_at}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`
                    : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}