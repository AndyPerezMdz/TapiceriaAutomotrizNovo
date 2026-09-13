import { emailWrapper, sendEmail } from "@/lib/email/resend";
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
        <p style="font-size: 14px; color: #6b6b6b; line-height: 1.5; margin: 0 0 16px;">
          Hola ${client.full_name}, tu queja sobre el pedido con folio ${complaint.order_id.slice(0, 8).toUpperCase()} cambió de estado a:
        </p>
        <div style="background-color: #fdf3d6; color: #a67c00; font-weight: 600; text-align: center; padding: 12px; border-radius: 6px; margin-bottom: 20px;">
          ${statusLabel}
        </div>
        ${
          complaint.resolution_note
            ? `<p style="font-size: 14px; color: #6b6b6b; line-height: 1.5; margin: 0 0 20px;">${complaint.resolution_note}</p>`
            : ""
        }
        <div style="text-align: center;">
          <a href="https://tapiceriaautomotrizbynovo.com/portal/quejas/${complaintId}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px;">
            Ver mi queja
          </a>
        </div>
      `,
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