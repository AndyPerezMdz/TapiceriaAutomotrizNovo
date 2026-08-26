import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function escapeCsv(value: string | number | null) {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
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

  if (!profile || profile.role === "cliente") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { data: submissions } = await supabase
    .from("contact_submissions")
    .select("created_at, name, phone, message, status")
    .order("created_at", { ascending: false });

  const headers = ["Fecha", "Nombre", "Teléfono", "Mensaje", "Estado"];

  const rows =
    submissions?.map((s) =>
      [
        new Date(s.created_at).toLocaleDateString("es-MX"),
        s.name,
        s.phone,
        s.message,
        s.status,
      ]
        .map(escapeCsv)
        .join(","),
    ) ?? [];

  const csv = [headers.join(","), ...rows].join("\n");
  const bom = "\uFEFF";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contactos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}