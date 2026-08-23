import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["change_role", "toggle_active", "resend_invite"]),
  userId: z.string().uuid(),
  role: z.enum(["empleado", "admin"]).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const { action, userId, role } = parsed.data;
  const adminClient = createAdminClient();

  if (action === "change_role") {
    if (!role) {
      return NextResponse.json({ error: "Falta el rol" }, { status: 400 });
    }
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (action === "toggle_active") {
    const { data: current } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .single();

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !current?.is_active })
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (action === "resend_invite") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name, role")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      return NextResponse.json({ error: "No se encontró el correo" }, { status: 400 });
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

    const { error } = await adminClient.auth.admin.inviteUserByEmail(profile.email, {
      data: { full_name: profile.full_name, role: profile.role },
      redirectTo: `${origin}/auth/confirm?next=/staff/aceptar-invitacion`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}