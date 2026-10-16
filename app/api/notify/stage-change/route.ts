import { sendPushToClient } from "@/lib/push/sendPush";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: myProfile } = await sessionClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!myProfile || myProfile.role === "cliente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { itemId } = await request.json();
  if (!itemId) {
    return NextResponse.json({ error: "Falta itemId" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: item } = await adminClient
    .from("order_items")
    .select(
      "order_id, services(title), service_stages(name), orders(client_id, vehicle_make, vehicle_model)",
    )
    .eq("id", itemId)
    .single();

  if (!item) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const service = item.services as unknown as { title: string } | null;
  const stage = item.service_stages as unknown as { name: string } | null;
  const order = item.orders as unknown as {
    client_id: string;
    vehicle_make: string | null;
    vehicle_model: string | null;
  } | null;

  if (!order?.client_id || !stage) {
    return NextResponse.json({ success: true });
  }

  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ");

  sendPushToClient(order.client_id, {
    title: service?.title ? `${service.title}: tu pedido avanzó` : "Tu pedido avanzó",
    body: `Ahora: ${stage.name}${vehicle ? ` · ${vehicle}` : ""}`,
    url: `/portal/pedidos/${item.order_id}`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}