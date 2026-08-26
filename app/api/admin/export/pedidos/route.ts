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

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "created_at, vehicle_make, vehicle_model, vehicle_year, status, estimated_price, final_price, service_description, profiles!orders_client_id_fkey(full_name, phone)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const headers = [
    "Fecha",
    "Cliente",
    "Teléfono",
    "Vehículo",
    "Estado",
    "Precio estimado",
    "Precio final",
    "Descripción",
  ];

  const rows =
    orders?.map((o) => {
      const client = o.profiles as unknown as { full_name: string; phone: string } | null;
      const vehicle = [o.vehicle_make, o.vehicle_model, o.vehicle_year]
        .filter(Boolean)
        .join(" ");
      return [
        new Date(o.created_at).toLocaleDateString("es-MX"),
        client?.full_name ?? "",
        client?.phone ?? "",
        vehicle,
        o.status,
        o.estimated_price ?? "",
        o.final_price ?? "",
        o.service_description ?? "",
      ]
        .map(escapeCsv)
        .join(",");
    }) ?? [];

  const csv = [headers.join(","), ...rows].join("\n");
  const bom = "\uFEFF"; // para que Excel lea bien los acentos

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}