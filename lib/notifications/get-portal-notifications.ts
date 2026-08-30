import type { SupabaseClient } from "@supabase/supabase-js";

export interface NotificationItem {
  id: string;
  type: "cotizacion" | "actualizacion" | "resena";
  title: string;
  description: string;
  href: string;
  date: string;
}

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
  const notifications: NotificationItem[] = [];

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, vehicle_make, vehicle_model, status, estimated_price, updated_at, client_last_viewed_at, created_at",
    )
    .eq("client_id", userId)
    .is("deleted_at", null);

  const typedOrders = (orders ?? []) as OrderRow[];

  typedOrders.forEach((o) => {
    if (o.status === "cotizado") {
      notifications.push({
        id: `quote-${o.id}`,
        type: "cotizacion",
        title: "Cotización esperando tu respuesta",
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

  return notifications;
}