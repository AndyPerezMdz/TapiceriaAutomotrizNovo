import { createClient } from "@/lib/supabase/server";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";

const rangeOptions = [
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
];

interface Props {
  searchParams: Promise<{ range?: string; view?: string; month?: string }>;
}

export default async function AdminReportesPage({ searchParams }: Props) {
  const { range, view, month } = await searchParams;
  const months = Number(range) || 6;
  const activeView = view === "dia" ? "dia" : "mes";

  const supabase = await createClient();
  const {
  data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = user
  ? await supabase.from("profiles").select("role").eq("id", user.id).single()
  : { data: null };

  if (myProfile?.role !== "admin") {
    redirect("/admin");
  }

  // ---------- Vista MES ----------
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - (months - 1));
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const [{ data: deliveredOrders }, { data: serviceCounts }] = await Promise.all([
    supabase
      .from("orders")
      .select("final_price, delivered_at")
      .eq("status", "entregado")
      .is("deleted_at", null)
      .not("delivered_at", "is", null)
      .gte("delivered_at", startDate.toISOString()),
    supabase
      .from("orders")
      .select("services(title)")
      .is("deleted_at", null)
      .gte("created_at", startDate.toISOString())
      .not("service_id", "is", null),
  ]);

  const monthlyRevenue: Record<string, number> = {};
  const monthMeta: { key: string; label: string; year: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyRevenue[key] = 0;
    monthMeta.push({
      key,
      label: d.toLocaleDateString("es-MX", { month: "short" }),
      year: d.getFullYear(),
    });
  }

  deliveredOrders?.forEach((o) => {
    if (!o.delivered_at) return;
    const d = new Date(o.delivered_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (key in monthlyRevenue) {
      monthlyRevenue[key] += o.final_price ?? 0;
    }
  });

  const revenueValues = monthMeta.map((m) => monthlyRevenue[m.key]);
  const maxRevenue = Math.max(...revenueValues, 1);
  const totalRevenue = revenueValues.reduce((sum, v) => sum + v, 0);

  const currentMonthTotal = revenueValues[revenueValues.length - 1] ?? 0;
  const previousMonthTotal = revenueValues[revenueValues.length - 2] ?? 0;
  const monthChange =
    previousMonthTotal > 0
      ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
      : 0;

  const serviceFrequency: Record<string, number> = {};
  serviceCounts?.forEach((o) => {
    const title = (o.services as unknown as { title: string } | null)?.title;
    if (title) {
      serviceFrequency[title] = (serviceFrequency[title] ?? 0) + 1;
    }
  });
  const topServices = Object.entries(serviceFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  let lastYearShown: number | null = null;

  // ---------- Vista DÍA ----------
  const today = new Date();
  const [selYear, selMonth] = month
    ? month.split("-").map(Number)
    : [today.getFullYear(), today.getMonth()];

  const monthStart = new Date(selYear, selMonth, 1);
  const monthEnd = new Date(selYear, selMonth + 1, 0, 23, 59, 59);
  const daysInMonth = monthEnd.getDate();
  const firstWeekday = monthStart.getDay();

  const { data: monthOrders } = await supabase
    .from("orders")
    .select("final_price, delivered_at")
    .eq("status", "entregado")
    .is("deleted_at", null)
    .not("delivered_at", "is", null)
    .gte("delivered_at", monthStart.toISOString())
    .lte("delivered_at", monthEnd.toISOString());

  const dailyRevenue: Record<number, number> = {};
  monthOrders?.forEach((o) => {
    if (!o.delivered_at) return;
    const d = new Date(o.delivered_at);
    dailyRevenue[d.getDate()] = (dailyRevenue[d.getDate()] ?? 0) + (o.final_price ?? 0);
  });

  const monthTotal = Object.values(dailyRevenue).reduce((sum, v) => sum + v, 0);
  const monthLabel = monthStart.toLocaleDateString("es-MX", {
    month: "long",
    year: "numeric",
  });

  function buildMonthHref(offset: number) {
    const d = new Date(selYear, selMonth + offset, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    return `/admin/reportes?view=dia&month=${key}`;
  }

  const weekdayLabels = ["D", "L", "M", "M", "J", "V", "S"];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl text-foreground">
          Reportes
        </h1>

        <div className="flex gap-2">
          <Link
            href="/admin/reportes"
            className={`rounded-full px-4 py-1.5 text-[15px] font-medium transition ${
              activeView === "mes"
                ? "bg-brand-yellow hover:bg-[#e8b90f] text-ink"
                : "border-[1.5px] border-field-border text-muted hover:border-foreground"
            }`}
          >
            Por mes
          </Link>
          <Link
            href="/admin/reportes?view=dia"
            className={`rounded-full px-4 py-1.5 text-[15px] font-medium transition ${
              activeView === "dia"
                ? "bg-brand-yellow hover:bg-[#e8b90f] text-ink"
                : "border-[1.5px] border-field-border text-muted hover:border-foreground"
            }`}
          >
            Por día
          </Link>
        </div>
      </div>

      {activeView === "mes" ? (
        <>
          <div className="mb-6 flex justify-end gap-2">
            {rangeOptions.map((opt) => (
              <a
                key={opt.value}
                href={`/admin/reportes?range=${opt.value}`}
                className={`rounded-full px-4 py-1.5 text-[15px] font-medium transition ${
                  months === Number(opt.value)
                    ? "bg-brand-yellow hover:bg-[#e8b90f] text-ink"
                    : "border-[1.5px] border-field-border text-muted hover:border-foreground"
                }`}
              >
                {opt.label}
              </a>
            ))}
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
              <p className="text-[13px] font-medium text-muted">
                Ingresos totales ({months} meses)
              </p>
              <p className="mt-2 text-2xl font-bold text-foreground">
                ${totalRevenue.toLocaleString("es-MX")}
              </p>
            </div>

            <div className="rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
              <p className="text-[13px] font-medium text-muted">Este mes vs. mes anterior</p>
              <div className="mt-2 flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">
                  ${currentMonthTotal.toLocaleString("es-MX")}
                </p>
                {previousMonthTotal > 0 ? (
                  <span
                    className={`flex items-center gap-0.5 text-[15px] font-medium ${
                      monthChange >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-brand-red"
                    }`}
                  >
                    {monthChange >= 0 ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                    {Math.abs(monthChange).toFixed(0)}%
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
            <h2 className="font-display text-2xl font-bold uppercase mb-4 text-foreground">
              Ingresos por mes (según fecha de entrega)
            </h2>

            <div className="mx-auto flex h-40 max-w-md items-end justify-center gap-4">
              {revenueValues.map((value, i) => {
                const heightPct = Math.max((value / maxRevenue) * 100, value > 0 ? 4 : 0);
                return (
                  <div key={i} className="flex h-40 w-10 items-end">
                    <div
                      className="w-full rounded-t bg-brand-yellow transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`$${value.toLocaleString("es-MX")}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mx-auto mt-2 flex max-w-md justify-center gap-4">
              {monthMeta.map((m, i) => {
                const showYear = m.year !== lastYearShown;
                lastYearShown = m.year;
                return (
                  <span key={i} className="w-10 text-center text-[10px] text-muted">
                    {m.label}
                    {showYear ? ` '${String(m.year).slice(-2)}` : ""}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
            <h2 className="font-display text-2xl font-bold uppercase mb-4 text-foreground">
              Servicios más solicitados
            </h2>
            {topServices.length === 0 ? (
              <p className="text-[15px] text-muted">Sin datos en este rango.</p>
            ) : (
              <div className="space-y-2">
                {topServices.map(([title, count]) => {
                  const maxCount = topServices[0][1];
                  return (
                    <div key={title}>
                      <div className="mb-1 flex items-center justify-between text-[15px]">
                        <span className="text-foreground">{title}</span>
                        <span className="text-muted">{count}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-black/5 dark:bg-white/5">
                        <div
                          className="h-full bg-brand-yellow"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
          <div className="mb-4 flex items-center justify-between">
            <Link
              href={buildMonthHref(-1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] border-field-border text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ChevronLeft size={16} />
            </Link>
            <div className="text-center">
              <p className="text-[15px] font-semibold capitalize text-foreground">
                {monthLabel}
              </p>
              <p className="text-[13px] text-muted">
                Total: ${monthTotal.toLocaleString("es-MX")}
              </p>
            </div>
            <Link
              href={buildMonthHref(1)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] border-field-border text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <ChevronRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {weekdayLabels.map((w, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-muted">
                {w}
              </div>
            ))}

            {Array.from({ length: firstWeekday }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const amount = dailyRevenue[day];
              const hasRevenue = amount && amount > 0;

              return (
                <div
                  key={day}
                  className={`group relative flex aspect-square flex-col items-center justify-center rounded-xl border text-[13px] ${
                    hasRevenue
                      ? "border-brand-yellow-dark bg-highlight font-semibold text-yellow-text dark:border-brand-yellow"
                      : "border-seam text-muted"
                  }`}
                >
                  <span>{day}</span>
                  {hasRevenue ? (
                    <span className="absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-2 py-1 text-[10px] text-ink group-hover:block">
                      ${amount.toLocaleString("es-MX")}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}