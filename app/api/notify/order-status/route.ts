import { emailWrapper, sendEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
      "vehicle_make, vehicle_model, status, estimated_price, profiles!orders_client_id_fkey(full_name, email)",
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
      <p style="font-size: 14px; color: #6b6b6b; line-height: 1.5; margin: 0 0 16px;">
        Hola ${client.full_name}, tu pedido${vehicle ? ` de ${vehicle}` : ""} cambió de estado a:
      </p>
      <div style="background-color: #fdf3d6; color: #a67c00; font-weight: 600; text-align: center; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
        ${statusLabel}
      </div>
      <div style="text-align: center;">
        <a href="https://tapiceriaautomotrizbynovo.com/portal" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px;">
          Ver mi pedido
        </a>
      </div>
    `,
  );

  const result = await sendEmail({
    to: client.email,
    subject: `Tu pedido está: ${statusLabel}`,
    html,
  });

  return NextResponse.json(result);
}