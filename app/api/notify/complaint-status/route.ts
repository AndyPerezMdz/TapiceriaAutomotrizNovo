import { escapeHtml } from "@/lib/email/sanitize";
import { emailUi, emailWrapper, sendEmail } from "@/lib/email/resend";
import { sendPushToClient } from "@/lib/push/sendPush";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const statusLabels: Record<string, string> = {
  abierta: "Abierta",
  atendida: "Atendida",
  cerrada: "Cerrada",
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

  const { complaintId } = await request.json();
  if (!complaintId) {
    return NextResponse.json({ error: "Falta complaintId" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: complaint } = await adminClient
    .from("complaints")
    .select("status, resolution_note, client_id, order_id, profiles!complaints_client_id_fkey(full_name, email)")
    .eq("id", complaintId)
    .single();

  if (!complaint) {
    return NextResponse.json({ error: "Queja no encontrada" }, { status: 404 });
  }

  const client = complaint.profiles as unknown as { full_name: string; email: string } | null;
  const statusLabel = statusLabels[complaint.status] ?? complaint.status;

  if (client?.email) {
    const html = emailWrapper(
      "Actualización de tu queja",
      `
        ${emailUi.p(`Hola ${escapeHtml(client.full_name ?? "")}, tu queja sobre el pedido con folio <strong>${complaint.order_id.slice(0, 8).toUpperCase()}</strong> cambió de estado:`)}
        ${emailUi.stamp(escapeHtml(statusLabel))}
        ${complaint.resolution_note ? emailUi.note(`<strong>Respuesta del taller:</strong><br />${escapeHtml(complaint.resolution_note)}`) : ""}
        ${emailUi.button(`https://tapiceriaautomotrizbynovo.com/portal/quejas/${complaintId}`, "Ver mi queja")}
      `,
      "Atención a clientes",
    );

    await sendEmail({ to: client.email, subject: `Tu queja está: ${statusLabel}`, html });
  }

  sendPushToClient(complaint.client_id, {
    title: "Actualización de tu queja",
    body: `Tu queja cambió de estado a: ${statusLabel}`,
    url: `/portal/quejas/${complaintId}`,
  }).catch(() => {});

  return NextResponse.json({ success: true });
}