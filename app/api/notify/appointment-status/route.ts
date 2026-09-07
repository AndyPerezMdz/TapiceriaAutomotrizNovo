import { sendPushToClient } from "@/lib/push/sendPush";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const statusLabels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
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

  const { appointmentId } = await request.json();
  if (!appointmentId) {
    return NextResponse.json({ error: "Falta appointmentId" }, { status: 400 });
  }

  const adminClient = createAdminClient();
  const { data: appointment } = await adminClient
    .from("appointments")
    .select("client_id, status, appointment_date, appointment_time")
    .eq("id", appointmentId)
    .single();

  if (!appointment || !appointment.client_id) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  const statusLabel = statusLabels[appointment.status] ?? appointment.status;

  sendPushToClient(appointment.client_id, {
    title: "Actualización de tu cita",
    body: `Tu cita del ${appointment.appointment_date} a las ${appointment.appointment_time} está: ${statusLabel}`,
    url: "/portal/mis-citas",
  }).catch(() => {});

  return NextResponse.json({ success: true });
}