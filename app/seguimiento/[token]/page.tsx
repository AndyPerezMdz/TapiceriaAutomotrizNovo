import { createClient } from "@/lib/supabase/server";
import { businessInfo } from "@/lib/constants/business";
import { Calendar, Car } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ServiceStageProgress,
  type ProgressStage,
} from "@/components/shared/ServiceStageProgress";

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
  stages: ProgressStage[];
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

  return (
    <div className="mx-auto min-h-screen max-w-lg px-6 py-16">
      <div className="mb-8 text-center">
        <Image
          src="/images/logo-negro-wbg.png"
          alt={businessInfo.name}
          width={140}
          height={56}
          className="mx-auto h-auto w-[120px]"
        />
      </div>

      <div className="rounded-lg border border-black/10 bg-surface p-6 dark:border-white/10">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Car size={16} className="text-muted" />
            <span className="text-sm font-medium text-foreground">
              {vehicle || "Pedido"}
            </span>
          </div>
          <span className="rounded-full bg-brand-yellow/20 px-3 py-1 text-xs font-medium text-brand-yellow-dark dark:text-brand-yellow">
            {statusLabels[order.status] ?? order.status}
          </span>
        </div>

        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Calendar size={12} />
          Iniciado el{" "}
          {new Date(order.created_at).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>

        {items.length > 0 ? (
          <div className="mb-4 border-t border-black/10 pt-4 dark:border-white/10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Servicios
            </p>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-foreground">
                      {items.length > 1 ? `${i + 1}. ` : ""}
                      {item.service_title}
                    </p>
                    {item.material_label ? (
                      <p className="text-xs text-muted">{item.material_label}</p>
                    ) : null}
                  </div>
                  {item.price !== null ? (
                    <p className="font-medium text-foreground">
                      ${item.price.toLocaleString("es-MX")}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
            {order.total_price !== null ? (
              <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 text-sm font-semibold dark:border-white/10">
                <span className="text-foreground">Total</span>
                <span className="text-foreground">
                  ${order.total_price.toLocaleString("es-MX")}
                </span>
              </div>
            ) : null}
          </div>
        ) : null}

        {stageGroups.length > 0 ? (
          <div className="mb-4 border-t border-black/10 pt-4 dark:border-white/10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Avance por servicio
            </p>
            <div className="space-y-4">
              {stageGroups.map((group) => (
                <div key={group.itemId}>
                  <p className="text-sm text-foreground">{group.serviceTitle}</p>
                  <ServiceStageProgress
                    stages={group.stages}
                    currentStageId={group.currentStageId}
                    completed={stagesCompleted}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-black/10 pt-4 dark:border-white/10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Seguimiento
          </p>
          <div className="space-y-3">
            {(history as HistoryEntry[] | null)?.map((h, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-brand-yellow" />
                <div>
                  <p className="text-sm text-foreground">
                    {statusLabels[h.status] ?? h.status}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(h.created_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        Este es un enlace de solo consulta compartido por {businessInfo.name}.
      </p>
    </div>
  );
}