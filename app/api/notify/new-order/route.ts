import { emailWrapper, sendEmail } from "@/lib/email/resend";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

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
      <p style="font-size: 14px; color: #6b6b6b; line-height: 1.5; margin: 0 0 8px;">
        <strong style="color: #1a1a1a;">${client?.full_name ?? "Cliente"}</strong> solicitó una cotización${vehicle ? ` para su ${vehicle}` : ""}.
      </p>
      <p style="font-size: 13px; color: #6b6b6b; line-height: 1.5; margin: 0 0 20px;">
        "${order.service_description}"
      </p>
      <div style="text-align: center;">
        <a href="https://tapiceriaautomotrizbynovo.com/admin/pedidos" style="display: inline-block; background-color: #f5c518; color: #1a1a1a; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px;">
          Revisar pedido
        </a>
      </div>
    `,
  );

  const result = await sendEmail({
    to: staffEmails,
    subject: `Nuevo pedido de ${client?.full_name ?? "un cliente"}`,
    html,
  });

  return NextResponse.json(result);
}