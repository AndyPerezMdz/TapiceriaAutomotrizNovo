import { Pill } from "@/components/taller";
import { ActivateCouponButton } from "@/components/portal/ActivateCouponButton";
import { EmptyState } from "@/components/shared/EmptyState";
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

  const [{ data: allCoupons }, { data: redemptions }, { data: activeCoupon }] =
    await Promise.all([
      supabase
        .from("coupons")
        .select(
          "id, title, description, discount_type, discount_value, expires_at, service_id, services(title)",
        )
        .in("audience", audienceFilter),
      supabase.from("coupon_redemptions").select("coupon_id").eq("client_id", user.id),
      supabase.from("active_coupons").select("coupon_id").eq("client_id", user.id).maybeSingle(),
    ]);

  const redeemedIds = new Set(redemptions?.map((r) => r.coupon_id) ?? []);
  const activeCouponId = activeCoupon?.coupon_id ?? null;

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
    <div className="max-w-3xl">
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-2 text-foreground">
        Mis cupones
      </h1>
      <p className="mb-6 text-[15px] text-muted">
        {isFrequent
          ? "Gracias por ser cliente frecuente — estos son tus cupones."
          : "Descuentos disponibles para tu próximo pedido."}
      </p>

      {activeCouponId ? (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-brand-yellow-dark/50 bg-highlight px-5 py-4 text-[15px] text-foreground">
          Tienes un cupón activado — aparecerá automáticamente cuando cotices un
          servicio compatible.
        </div>
      ) : null}

      <div role="group" aria-label="Filtrar cupones" className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Pill key={t.value} href={`/portal/cupones?tab=${t.value}`} active={activeTab === t.value}>
            {t.label} · {t.items.length}
          </Pill>
        ))}
      </div>

          {currentItems.length === 0 ? (
            <EmptyState
              icon={Tag}
              title={
                activeTab === "activos"
                  ? "Aún no tienes cupones"
                  : activeTab === "canjeados"
                    ? "Aún no has canjeado ninguno"
                    : "Sin cupones caducados"
              }
              description={
                activeTab === "activos"
                  ? "Síguenos en Facebook para enterarte cuando lancemos descuentos nuevos."
                  : activeTab === "canjeados"
                    ? "Los cupones que uses van a aparecer aquí como historial."
                    : "Aquí aparecerían los cupones que ya vencieron sin usarse."
              }
            />
          ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {currentItems.map((c) => {
            const service = (c.services as unknown as { title: string } | null)?.title;
            const discountLabel =
              c.discount_type === "percentage"
                ? `${c.discount_value}% menos`
                : `$${c.discount_value.toLocaleString("es-MX")} menos`;

            return (
              <div
                key={c.id}
                className={`relative overflow-hidden rounded-[18px] p-5 sm:p-6 ${
                  activeTab === "activos"
                    ? "bg-brand-yellow text-ink"
                    : "border-2 border-dashed border-field-border bg-surface text-foreground opacity-75"
                }`}
              >
                {activeTab === "activos" ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2 rounded-xl border-2 border-dashed border-ink/35"
                  />
                ) : null}
                <div className="relative">
                  <p className="font-display text-4xl font-extrabold uppercase leading-none">
                    {discountLabel}
                  </p>
                  <p className="mt-2 text-base font-semibold">{c.title}</p>
                  {c.description ? (
                    <p className={`mt-1 text-[15px] ${activeTab === "activos" ? "text-[#2b2400]" : "text-muted"}`}>
                      {c.description}
                    </p>
                  ) : null}
                  <p className={`mt-2 text-[15px] ${activeTab === "activos" ? "text-[#3d3200]" : "text-muted"}`}>
                    Válido en: {service ?? "cualquier servicio"}
                    {c.expires_at
                      ? ` · Vence ${new Date(`${c.expires_at}T00:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "short" })}`
                      : ""}
                  </p>
                </div>

                {activeTab === "activos" ? (
                  <div className="relative">
                    <ActivateCouponButton couponId={c.id} isActive={activeCouponId === c.id} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}