import { escapeHtml } from "@/lib/email/sanitize";
import { emailUi, emailWrapper, sendEmail } from "@/lib/email/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createAdminClient();

  const { orderId } = await request.json();
  if (!orderId) {
    return NextResponse.json({ error: "Falta orderId" }, { status: 400 });
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      "vehicle_make, vehicle_model, service_description, profiles!orders_client_id_fkey(full_name)",
    )
    .eq("id", orderId)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const { data: staff } = await supabase
    .from("profiles")
    .select("email")
    .in("role", ["admin", "empleado"])
    .eq("is_active", true);

  const staffEmails = staff?.map((s) => s.email).filter(Boolean) as string[] | undefined;

  if (!staffEmails || staffEmails.length === 0) {
    return NextResponse.json({ error: "Sin destinatarios" }, { status: 400 });
  }

  const client = order.profiles as unknown as { full_name: string } | null;
  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ");

  const html = emailWrapper(
    "Nuevo pedido recibido",
    `
      ${emailUi.p(`<strong>${escapeHtml(client?.full_name ?? "Cliente")}</strong> solicitó una cotización${vehicle ? ` para su ${escapeHtml(vehicle)}` : ""}.`)}
      ${emailUi.note(`“${escapeHtml(order.service_description ?? "")}”`)}
      ${emailUi.button("https://tapiceriaautomotrizbynovo.com/admin/pedidos", "Revisar pedido", "yellow")}
    `,
    "Aviso para el taller",
  );

  const result = await sendEmail({
    to: staffEmails,
    subject: `Nuevo pedido de ${client?.full_name ?? "un cliente"}`,
    html,
  });

  return NextResponse.json(result);
}