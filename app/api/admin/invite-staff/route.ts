import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(2),
  role: z.enum(["empleado", "admin"]),
});

export async function POST(request: Request) {
  // 1. Verifica que quien llama esta ruta sea un admin real
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // 2. Valida los datos
  const body = await request.json();
  const parsed = inviteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // 3. Crea la cuenta con el rol especificado, usando la Service Role Key
  const adminClient = createAdminClient();
  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        full_name: parsed.data.fullName,
        role: parsed.data.role,
      },
      redirectTo: `${origin}/staff/aceptar-invitacion`,
    },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, userId: data.user?.id });
}