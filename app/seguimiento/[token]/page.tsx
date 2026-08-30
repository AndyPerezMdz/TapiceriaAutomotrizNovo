import { createClient } from "@/lib/supabase/server";
import { businessInfo } from "@/lib/constants/business";
import { Calendar, Car } from "lucide-react";
import Image from "next/image";
import { notFound } from "next/navigation";

interface HistoryEntry {
    status: string;
    created_at: string;
}

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

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SeguimientoPublicoPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();

  const [{ data: orderData }, { data: history }] = await Promise.all([
    supabase.rpc("get_order_by_share_token", { p_token: token }),
    supabase.rpc("get_order_history_by_share_token", { p_token: token }),
  ]);

  const order = orderData?.[0];

  if (!order) {
    notFound();
  }

  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ");

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

        {order.service_title ? (
          <p className="mb-4 text-sm text-muted">{order.service_title}</p>
        ) : null}

        <div className="mb-4 flex items-center gap-1.5 text-xs text-muted">
          <Calendar size={12} />
          Iniciado el{" "}
          {new Date(order.created_at).toLocaleDateString("es-MX", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>

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