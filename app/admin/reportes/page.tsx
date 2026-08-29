import { createClient } from "@/lib/supabase/server";
import { TrendingDown, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

const rangeOptions = [
  { value: "3", label: "Últimos 3 meses" },
  { value: "6", label: "Últimos 6 meses" },
  { value: "12", label: "Últimos 12 meses" },
];

interface Props {
  searchParams: Promise<{ range?: string }>;
}

export default async function AdminReportesPage({ searchParams }: Props) {
  const { range } = await searchParams;
  const months = Number(range) || 6;

  const supabase = await createClient();

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

  const currentMonth = revenueValues[revenueValues.length - 1] ?? 0;
  const previousMonth = revenueValues[revenueValues.length - 2] ?? 0;
  const monthChange =
    previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Reportes
        </h1>
        <div className="flex gap-2">
          {rangeOptions.map((opt) => (
            <a
              key={opt.value}
              href={`/admin/reportes?range=${opt.value}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                months === Number(opt.value)
                  ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
                  : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
          <p className="text-xs font-medium text-muted">
            Ingresos totales ({months} meses)
          </p>
          <p className="mt-2 text-2xl font-bold text-foreground">
            ${totalRevenue.toLocaleString("es-MX")}
          </p>
        </div>

        <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
          <p className="text-xs font-medium text-muted">Este mes vs. mes anterior</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="text-2xl font-bold text-foreground">
              ${currentMonth.toLocaleString("es-MX")}
            </p>
            {previousMonth > 0 ? (
              <span
                className={`flex items-center gap-0.5 text-sm font-medium ${
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

      <div className="mb-8 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Ingresos por mes (según fecha de entrega)
        </h2>

        <div className="flex h-40 items-end gap-2">
          {revenueValues.map((value, i) => {
            const heightPct = Math.max((value / maxRevenue) * 100, value > 0 ? 4 : 0);
            return (
              <div key={i} className="flex h-40 flex-1 items-end">
                <div
                  className="w-full rounded-t bg-brand-yellow transition-all"
                  style={{ height: `${heightPct}%` }}
                  title={`$${value.toLocaleString("es-MX")}`}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-2 flex gap-2">
          {monthMeta.map((m, i) => {
            const showYear = m.year !== lastYearShown;
            lastYearShown = m.year;
            return (
              <span key={i} className="flex-1 text-center text-[10px] text-muted">
                {m.label}
                {showYear ? ` '${String(m.year).slice(-2)}` : ""}
              </span>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Servicios más solicitados
        </h2>
        {topServices.length === 0 ? (
          <p className="text-sm text-muted">Sin datos en este rango.</p>
        ) : (
          <div className="space-y-2">
            {topServices.map(([title, count]) => {
              const maxCount = topServices[0][1];
              return (
                <div key={title}>
                  <div className="mb-1 flex items-center justify-between text-sm">
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
    </div>
  );
}