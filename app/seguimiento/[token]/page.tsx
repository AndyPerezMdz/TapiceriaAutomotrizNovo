import { createClient } from "@/lib/supabase/server";
import { businessInfo } from "@/lib/constants/business";
import { Stamp, StageStepper, Ticket, type StepperStage } from "@/components/taller";
import Link from "next/link";
import { notFound } from "next/navigation";

const statusLabels: Record<string, string> = {
  pendiente_revision: "Pendiente de revisión",
  cotizado: "Cotizado",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
  en_proceso: "En proceso",
  listo_para_entrega: "Listo para entrega",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

interface HistoryEntry {
  status: string;
  created_at: string;
}

interface ItemEntry {
  service_title: string;
  material_label: string | null;
  price: number | null;
}

interface StageRow {
  item_id: string;
  item_order: number;
  service_title: string;
  stage_id: string;
  stage_name: string;
  client_description: string | null;
  stage_order: number;
  is_current: boolean;
}

interface StageGroup {
  itemId: string;
  serviceTitle: string;
  currentStageId: string | null;
  stages: StepperStage[];
}

function groupStages(rows: StageRow[]): StageGroup[] {
  const groups = new Map<string, StageGroup>();
  for (const row of rows) {
    let group = groups.get(row.item_id);
    if (!group) {
      group = {
        itemId: row.item_id,
        serviceTitle: row.service_title,
        currentStageId: null,
        stages: [],
      };
      groups.set(row.item_id, group);
    }
    group.stages.push({
      id: row.stage_id,
      name: row.stage_name,
      client_description: row.client_description,
    });
    if (row.is_current) group.currentStageId = row.stage_id;
  }
  return [...groups.values()];
}

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SeguimientoPublicoPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const [{ data: orderData }, { data: history }, { data: itemsData }, { data: stagesData }] =
    await Promise.all([
      supabase.rpc("get_order_by_share_token", { p_token: token }),
      supabase.rpc("get_order_history_by_share_token", { p_token: token }),
      supabase.rpc("get_order_items_by_share_token", { p_token: token }),
      supabase.rpc("get_order_stages_by_share_token", { p_token: token }),
    ]);

  const order = orderData?.[0];

  if (!order) {
    notFound();
  }

  const items = (itemsData as ItemEntry[] | null) ?? [];
  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ");

  const showStages = ["aprobado", "en_proceso", "listo_para_entrega", "entregado"].includes(
    order.status,
  );
  const stagesCompleted =
    order.status === "listo_para_entrega" || order.status === "entregado";
  const stageGroups = showStages ? groupStages((stagesData as StageRow[] | null) ?? []) : [];

  const folio = order.id ? String(order.id).slice(0, 8).toUpperCase() : null;
  const started = new Date(order.created_at).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Merida",
  });
  const card = "rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5";
  const h2 = "mb-4 font-display text-[28px] font-bold uppercase leading-none text-foreground";

  return (
    <div className="theme-taller min-h-screen bg-background">
      <div className="mx-auto max-w-2xl space-y-6 px-5 py-10 sm:py-14">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-3xl font-extrabold uppercase leading-none text-foreground">
            Novo
          </Link>
          <span className="text-sm text-muted">Seguimiento de pedido</span>
        </div>

        <Ticket
          stub={
            <dl className="flex flex-wrap gap-x-10 gap-y-3">
              {folio ? (
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Folio</dt>
                  <dd className="mt-1 font-code text-base font-semibold">{folio}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Recibido</dt>
                <dd className="mt-1 text-base font-semibold">{started}</dd>
              </div>
              {order.total_price !== null ? (
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Total</dt>
                  <dd className="mt-1 font-display text-2xl font-extrabold leading-none text-brand-yellow">
                    ${order.total_price.toLocaleString("es-MX")}
                  </dd>
                </div>
              ) : null}
            </dl>
          }
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-brand-yellow">Orden de trabajo</p>
              <h1 className="mt-2 font-display text-5xl font-extrabold uppercase leading-[0.9] sm:text-6xl">
                {vehicle || "Pedido"}
              </h1>
            </div>
            <Stamp label={statusLabels[order.status] ?? order.status} size="md" />
          </div>
        </Ticket>

        {items.length > 0 ? (
          <section className={card}>
            <h2 className={h2}>Servicios</h2>
            <ul className="divide-y divide-seam">
              {items.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 gap-3">
                    <span className="font-display text-lg font-extrabold leading-6 text-yellow-text">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{item.service_title}</p>
                      {item.material_label ? <p className="text-sm text-muted">{item.material_label}</p> : null}
                    </div>
                  </div>
                  {item.price !== null ? (
                    <p className="shrink-0 font-display text-xl font-bold text-foreground">
                      ${item.price.toLocaleString("es-MX")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {stageGroups.length > 0 ? (
          <section className={`${card} space-y-6`}>
            <h2 className={`${h2} !mb-0`}>Avance en el taller</h2>
            {stageGroups.map((group, i) => (
              <div key={group.itemId} className={i > 0 ? "border-t-2 border-dashed border-seam pt-6" : ""}>
                {stageGroups.length > 1 ? (
                  <p className="mb-3 font-display text-xl font-bold uppercase text-foreground">{group.serviceTitle}</p>
                ) : null}
                <StageStepper stages={group.stages} currentStageId={group.currentStageId} completed={stagesCompleted} />
              </div>
            ))}
          </section>
        ) : null}

        <section className={card}>
          <h2 className={h2}>Historial</h2>
          <ol className="relative space-y-4 border-l-2 border-dashed border-seam pl-5">
            {(history as HistoryEntry[] | null)?.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-ink bg-brand-yellow dark:border-white" />
                <p className="font-semibold text-foreground">{statusLabels[h.status] ?? h.status}</p>
                <p className="text-sm text-muted">
                  {new Date(h.created_at).toLocaleString("es-MX", {
                    day: "numeric",
                    month: "short",
                    hour: "numeric",
                    minute: "2-digit",
                    timeZone: "America/Merida",
                  })}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <p className="text-center text-sm text-muted">
          Enlace de solo consulta compartido por {businessInfo.name}.
        </p>
      </div>
    </div>
  );
}
