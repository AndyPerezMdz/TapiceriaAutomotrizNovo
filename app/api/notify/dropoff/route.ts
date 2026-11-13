import { escapeHtml } from "@/lib/email/sanitize";
import { emailUi, emailWrapper, sendEmail } from "@/lib/email/resend";
import { sendPushToClient } from "@/lib/push/sendPush";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SITE = "https://tapiceriaautomotrizbynovo.com";

function dateLabel(date: string, time: string) {
  const d = new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${d}, ${time}`;
}

/** Avisa a la otra parte cuando hay una propuesta nueva o una fecha confirmada. */
export async function POST(request: Request) {
  const session = await createClient();
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "Falta orderId" }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, client_id, vehicle_make, vehicle_model, profiles!orders_client_id_fkey(full_name, email)")
    .eq("id", orderId)
    .single();
  if (!order) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  // Solo el dueño del pedido o el staff pueden disparar el aviso.
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).single();
  const isStaff = me?.role === "admin" || me?.role === "empleado";
  if (!isStaff && order.client_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: last } = await admin
    .from("dropoff_proposals")
    .select("proposed_by, proposed_date, proposed_time, status")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (!last) return NextResponse.json({ ok: true });

  const client = order.profiles as unknown as { full_name: string | null; email: string | null } | null;
  const vehicle = [order.vehicle_make, order.vehicle_model].filter(Boolean).join(" ") || "tu vehículo";
  const when = dateLabel(last.proposed_date, last.proposed_time);
  const folio = order.id.slice(0, 8).toUpperCase();

  // ¿A quién le toca enterarse?
  const toClient =
    (last.status === "pendiente" && last.proposed_by === "staff") ||
    (last.status === "aceptada" && last.proposed_by === "cliente");

  if (toClient) {
    const confirmed = last.status === "aceptada";
    const title = confirmed ? "Fecha confirmada" : "Te proponemos una fecha";
    const body = confirmed
      ? `Te esperamos con tu ${vehicle} el ${when}.`
      : `¿Puedes traer tu ${vehicle} el ${when}? Confírmalo o sugiere otra fecha.`;
    await sendPushToClient(order.client_id, { title, body, url: `/portal/pedidos/${order.id}` }).catch(() => {});
    if (client?.email) {
      await sendEmail({
        to: client.email,
        subject: `${title} · ${vehicle}`,
        html: emailWrapper(
          title,
          `${emailUi.p(`Hola ${escapeHtml(client.full_name ?? "")}, ${escapeHtml(body)}`)}
           ${emailUi.vale("Traer el coche", escapeHtml(when))}
           ${emailUi.button(`${SITE}/portal/pedidos/${order.id}`, confirmed ? "Ver mi pedido" : "Responder")}`,
          "Fecha para traer tu coche",
        ),
      });
    }
  } else {
    // Aviso al staff: el cliente sugirió otra fecha o aceptó la del taller.
    const { data: staff } = await admin
      .from("profiles")
      .select("email")
      .in("role", ["admin", "empleado"])
      .eq("is_active", true);
    const emails = (staff?.map((s) => s.email).filter(Boolean) ?? []) as string[];
    if (emails.length > 0) {
      const confirmed = last.status === "aceptada";
      const title = confirmed ? "El cliente confirmó la fecha" : "El cliente sugiere otra fecha";
      await sendEmail({
        to: emails,
        subject: `${title} · ${vehicle} (${folio})`,
        html: emailWrapper(
          title,
          `${emailUi.p(`<strong>${escapeHtml(client?.full_name ?? "Cliente")}</strong> · ${escapeHtml(vehicle)}`)}
           ${emailUi.vale(confirmed ? "Confirmado" : "Propone", escapeHtml(when))}
           ${emailUi.button(`${SITE}/admin/pedidos/${order.id}`, confirmed ? "Ver pedido" : "Responder", "yellow")}`,
          "Aviso para el taller",
        ),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
