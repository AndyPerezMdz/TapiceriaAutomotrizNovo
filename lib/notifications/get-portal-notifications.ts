import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationItem {
  id: string;
  /** Llave única por aviso + fecha: si el pedido vuelve a cambiar, se vuelve a marcar como nueva. */
  key: string;
  type: "cotizacion" | "recordatorio" | "actualizacion" | "resena";
  title: string;
  description: string;
  href: string;
  date: string;
  read: boolean;
}

type Draft = Omit<NotificationItem, "key" | "read">;

interface OrderRow {
  id: string;
  vehicle_make: string | null;
  vehicle_model: string | null;
  status: string;
  estimated_price: number | null;
  updated_at: string | null;
  client_last_viewed_at: string | null;
  created_at: string;
}

function vehicleLabel(o: OrderRow) {
  return [o.vehicle_make, o.vehicle_model].filter(Boolean).join(" ") || "tu pedido";
}

export async function getPortalNotifications(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationItem[]> {
  const notifications: Draft[] = [];

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, vehicle_make, vehicle_model, status, estimated_price, updated_at, client_last_viewed_at, created_at",
    )
    .eq("client_id", userId)
    .is("deleted_at", null);

  const typedOrders = (orders ?? []) as OrderRow[];

  // Último recordatorio del taller por pedido cotizado (si la tabla existe).
  const quotedIds = typedOrders.filter((o) => o.status === "cotizado").map((o) => o.id);
  const lastReminder = new Map<string, string>();
  if (quotedIds.length > 0) {
    const { data: reminders } = await supabase
      .from("quote_reminders")
      .select("order_id, created_at")
      .in("order_id", quotedIds)
      .order("created_at", { ascending: false });
    (reminders ?? []).forEach((r) => {
      if (!lastReminder.has(r.order_id)) lastReminder.set(r.order_id, r.created_at);
    });
  }

  typedOrders.forEach((o) => {
    if (o.status === "cotizado" && lastReminder.has(o.id)) {
      notifications.push({
        id: `quote-${o.id}`,
        type: "recordatorio",
        title: "El taller te recuerda tu cotización",
        description: `${vehicleLabel(o)}${o.estimated_price ? ` · $${o.estimated_price.toLocaleString("es-MX")}` : ""}`,
        href: `/portal/pedidos/${o.id}`,
        date: lastReminder.get(o.id)!,
      });
    } else if (o.status === "cotizado") {
      notifications.push({
        id: `quote-${o.id}`,
        type: "cotizacion",
        title: "Tu cotización está lista",
        description: `${vehicleLabel(o)}${o.estimated_price ? ` · $${o.estimated_price.toLocaleString("es-MX")}` : ""}`,
        href: `/portal/pedidos/${o.id}`,
        date: o.updated_at ?? o.created_at,
      });
    } else if (
      !["entregado", "cancelado", "rechazado"].includes(o.status) &&
      o.updated_at &&
      (!o.client_last_viewed_at || new Date(o.updated_at) > new Date(o.client_last_viewed_at))
    ) {
      notifications.push({
        id: `update-${o.id}`,
        type: "actualizacion",
        title: "Tu pedido tiene una actualización",
        description: vehicleLabel(o),
        href: `/portal/pedidos/${o.id}`,
        date: o.updated_at,
      });
    }
  });

  const deliveredIds = typedOrders.filter((o) => o.status === "entregado").map((o) => o.id);

  if (deliveredIds.length > 0) {
    const { data: reviewed } = await supabase
      .from("reviews")
      .select("order_id")
      .in("order_id", deliveredIds);

    const reviewedSet = new Set(reviewed?.map((r) => r.order_id) ?? []);

    typedOrders
      .filter((o) => o.status === "entregado" && !reviewedSet.has(o.id))
      .forEach((o) => {
        notifications.push({
          id: `review-${o.id}`,
          type: "resena",
          title: "¿Cómo fue tu experiencia?",
          description: vehicleLabel(o),
          href: `/portal/pedidos/${o.id}`,
          date: o.updated_at ?? o.created_at,
        });
      });
  }

  notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const withKeys = notifications.map((n) => ({ ...n, key: `${n.id}@${n.date}` }));

  // Cuáles ya leyó (si la tabla existe; si no, todas cuentan como nuevas).
  let readKeys = new Set<string>();
  if (withKeys.length > 0) {
    const { data: reads } = await supabase
      .from("notification_reads")
      .select("notification_key")
      .eq("user_id", userId)
      .in(
        "notification_key",
        withKeys.map((n) => n.key),
      );
    readKeys = new Set((reads ?? []).map((r) => r.notification_key));
  }

  return withKeys.map((n) => ({ ...n, read: readKeys.has(n.key) }));
}