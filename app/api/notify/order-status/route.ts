import { escapeHtml } from "@/lib/email/sanitize";
import { emailUi, emailWrapper, sendEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendPushToClient } from "@/lib/push/sendPush";

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

  const { orderId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: "Falta orderId" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: order } = await adminClient
    .from("orders")
    .select(
      "client_id, vehicle_make, vehicle_model, status, estimated_price, profiles!orders_client_id_fkey(full_name, email)",
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const client = order.profiles as unknown as {
    full_name: string;
    email: string;
  } | null;

  if (!client?.email) {
    return NextResponse.json({ error: "Cliente sin correo" }, { status: 400 });
  }

  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ");
  const statusLabel = statusLabels[order.status] ?? order.status;

  const html = emailWrapper(
    "Tu pedido tiene una actualización",
    `
      ${emailUi.p(`Hola ${escapeHtml(client.full_name ?? "")}, tu pedido${vehicle ? ` de ${escapeHtml(vehicle)}` : ""} cambió de estado:`)}
      ${emailUi.stamp(escapeHtml(statusLabel))}
      ${emailUi.button("https://tapiceriaautomotrizbynovo.com/portal", "Ver mi pedido")}
    `,
    "Orden de trabajo",
  );

  const result = await sendEmail({
    to: client.email,
    subject: `Tu pedido está: ${statusLabel}`,
    html,
  });

const isDelivered = order.status === "entregado";

  sendPushToClient(order.client_id, {
    title: isDelivered ? "¡Tu pedido fue entregado!" : "Actualización de tu pedido",
    body: isDelivered
      ? `Tu pedido${vehicle ? ` de ${vehicle}` : ""} está listo. Cuéntanos cómo fue tu experiencia.`
      : `Tu pedido${vehicle ? ` de ${vehicle}` : ""} cambió de estado a: ${statusLabel}`,
    url: "/portal",
  }).catch(() => {});

  return NextResponse.json(result);
}