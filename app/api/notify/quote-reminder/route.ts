import { emailWrapper, sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/sanitize";
import { sendPushToClient } from "@/lib/push/sendPush";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Horas mínimas entre un recordatorio y otro para el mismo pedido. */
const COOLDOWN_HOURS = 12;

type Channel = "push" | "email";

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

  const body = await request.json().catch(() => ({}));
  const orderId = typeof body.orderId === "string" ? body.orderId : null;
  const requested: Channel[] = Array.isArray(body.channels)
    ? body.channels.filter((c: unknown): c is Channel => c === "push" || c === "email")
    : ["push", "email"];

  if (!orderId || requested.length === 0) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: order } = await adminClient
    .from("orders")
    .select(
      "id, client_id, status, estimated_price, vehicle_make, vehicle_model, deleted_at, profiles!orders_client_id_fkey(full_name, email)",
    )
    .eq("id", orderId)
    .single();

  if (!order || order.deleted_at) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  if (order.status !== "cotizado") {
    return NextResponse.json(
      { error: "Este pedido ya no está esperando respuesta del cliente." },
      { status: 409 },
    );
  }

  const { data: last } = await adminClient
    .from("quote_reminders")
    .select("created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (last) {
    const hours = (Date.now() - new Date(last.created_at).getTime()) / 36e5;
    if (hours < COOLDOWN_HOURS) {
      const wait = Math.ceil(COOLDOWN_HOURS - hours);
      return NextResponse.json(
        { error: `Ya se le recordó hace poco. Puedes volver a hacerlo en ${wait} h.` },
        { status: 429 },
      );
    }
  }

  const client = order.profiles as unknown as { full_name: string | null; email: string | null } | null;
  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ");
  const price = order.estimated_price
    ? `$${Number(order.estimated_price).toLocaleString("es-MX")}`
    : null;
  const url = `https://tapiceriaautomotrizbynovo.com/portal/pedidos/${order.id}`;

  const sent: Channel[] = [];

  if (requested.includes("push") && order.client_id) {
    const { count } = await adminClient
      .from("push_subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("client_id", order.client_id);

    if ((count ?? 0) > 0) {
      try {
        await sendPushToClient(order.client_id, {
          title: "Tu cotización te está esperando",
          body: `${vehicle || "Tu pedido"}${price ? ` · ${price}` : ""}. Acéptala para que empecemos.`,
          url: `/portal/pedidos/${order.id}`,
        });
        sent.push("push");
      } catch (error) {
        console.error("Recordatorio push falló:", error);
      }
    }
  }

  if (requested.includes("email") && client?.email) {
    const html = emailWrapper(
      "Tu cotización te está esperando",
      `
        <p style="font-size: 14px; color: #6b6b6b; line-height: 1.5; margin: 0 0 16px;">
          Hola ${escapeHtml(client.full_name ?? "")}, ya tenemos lista la cotización de tu pedido${vehicle ? ` de ${escapeHtml(vehicle)}` : ""}.
          Revísala y dinos si le entramos.
        </p>
        ${
          price
            ? `<div style="background-color: #f5c518; color: #1a1a1a; font-weight: 800; font-size: 22px; text-align: center; padding: 14px; border-radius: 8px; margin-bottom: 20px;">${price}</div>`
            : ""
        }
        <div style="text-align: center;">
          <a href="${url}" style="display: inline-block; background-color: #1a1a1a; color: #f5c518; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 8px;">
            Ver mi cotización
          </a>
        </div>
      `,
    );
    const result = await sendEmail({
      to: client.email,
      subject: "Tu cotización te está esperando",
      html,
    });
    if (!("error" in result)) sent.push("email");
  }

  if (sent.length === 0) {
    return NextResponse.json(
      {
        error:
          "No se pudo mandar: el cliente no tiene notificaciones activadas en su celular ni un correo válido.",
      },
      { status: 422 },
    );
  }

  await adminClient.from("quote_reminders").insert({
    order_id: order.id,
    sent_by: user.id,
    channels: sent,
  });

  return NextResponse.json({ success: true, sent });
}
