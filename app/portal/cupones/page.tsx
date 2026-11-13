import { Pill } from "@/components/taller";
import { ActivateCouponButton } from "@/components/portal/ActivateCouponButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "lucide-react";
import Link from "next/link";

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

  const [{ data: isFrequent }, { data: myCoupons }, { data: activeCoupon }] = await Promise.all([
    supabase.rpc("is_frequent_client", { p_client_id: user.id }),
    supabase.rpc("get_my_coupons"),
    supabase.from("active_coupons").select("coupon_id").eq("client_id", user.id).maybeSingle(),
  ]);

  type MyCoupon = {
    id: string;
    title: string;
    description: string | null;
    discount_type: string;
    discount_value: number;
    audience: string;
    service_title: string | null;
    expires_at: string | null;
    is_personal: boolean;
    requires_deposit: boolean;
    status: "activo" | "canjeado" | "caducado";
    redeemed_at: string | null;
    order_id: string | null;
  };
  const all = (myCoupons ?? []) as MyCoupon[];
  const activeCouponId = activeCoupon?.coupon_id ?? null;

  const activos = all.filter((c) => c.status === "activo");
  const canjeados = all
    .filter((c) => c.status === "canjeado")
    .sort((a, b) => (b.redeemed_at ?? "").localeCompare(a.redeemed_at ?? ""));
  const caducados = all
    .filter((c) => c.status === "caducado")
    .sort((a, b) => (b.expires_at ?? "").localeCompare(a.expires_at ?? ""));

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
      <p className="mb-6 text-[0.9375rem] text-muted">
        {isFrequent
          ? "Gracias por ser cliente frecuente — estos son tus cupones."
          : "Descuentos disponibles para tu próximo pedido."}
      </p>

      {activeCouponId ? (
        <div className="mb-6 rounded-2xl border-2 border-dashed border-brand-yellow-dark/50 bg-highlight px-5 py-4 text-[0.9375rem] text-foreground">
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
            const service = c.service_title;
            const shortDate = (iso: string) =>
              new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
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
                  <p className="mt-2 text-base font-semibold">
                    {c.title}
                    {c.audience === "nuevos" ? (
                      <span className="ml-2 inline-block rounded-md border-[1.5px] border-current px-1.5 py-0.5 align-middle text-[0.6875rem] font-bold uppercase tracking-wide">
                        Primer pedido
                      </span>
                    ) : null}
                  </p>
                  {c.description ? (
                    <p className={`mt-1 text-[0.9375rem] ${activeTab === "activos" ? "text-[#2b2400]" : "text-muted"}`}>
                      {c.description}
                    </p>
                  ) : null}
                  <p className={`mt-2 text-[0.9375rem] ${activeTab === "activos" ? "text-[#3d3200]" : "text-muted"}`}>
                    Válido en: {service ?? "cualquier servicio"}
                    {c.expires_at && c.status !== "canjeado"
                      ? ` · ${c.status === "caducado" ? "Venció" : "Vence"} ${shortDate(`${c.expires_at}T00:00:00`)}`
                      : ""}
                  </p>
                  {c.requires_deposit && c.status === "activo" ? (
                    <p className="mt-2 text-[0.9375rem] font-semibold">
                      Válido si dejas el 50% de anticipo al agendar.
                    </p>
                  ) : null}
                  {c.status === "canjeado" && c.redeemed_at ? (
                    <p className="mt-2 border-t-2 border-dashed border-seam pt-2 text-[0.9375rem] text-foreground">
                      Usado el {shortDate(c.redeemed_at)}
                      {c.order_id ? (
                        <>
                          {" · "}
                          <Link href={`/portal/pedidos/${c.order_id}`} className="font-semibold underline underline-offset-4">
                            Pedido {c.order_id.slice(0, 8).toUpperCase()}
                          </Link>
                        </>
                      ) : null}
                    </p>
                  ) : null}
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