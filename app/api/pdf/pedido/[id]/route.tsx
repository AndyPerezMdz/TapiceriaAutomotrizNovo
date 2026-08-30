import { CotizacionDocument } from "@/lib/pdf/CotizacionDocument";
import { businessInfo } from "@/lib/constants/business";
import { getBusinessSettings } from "@/lib/data/business-settings";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  const { id } = await params;
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

  const isStaff = myProfile?.role === "admin" || myProfile?.role === "empleado";

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, client_id, created_at, status, estimated_price, final_price, vehicle_make, vehicle_model, vehicle_year, service_description, profiles!orders_client_id_fkey(full_name, phone), services(title), material_types(name), material_colors(name)",
    )
    .eq("id", id)
    .single();

  if (!order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const isOwner = order.client_id === user.id;
  if (!isOwner && !isStaff) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const client = order.profiles as unknown as {
    full_name: string;
    phone: string | null;
  } | null;
  const service = order.services as unknown as { title: string } | null;
  const material = order.material_types as unknown as { name: string } | null;
  const color = order.material_colors as unknown as { name: string } | null;

  const isReceipt = order.status === "entregado";
  const price = isReceipt ? order.final_price : order.estimated_price;

  if (price === null && !isReceipt) {
    return NextResponse.json(
      { error: "Este pedido aún no tiene una cotización" },
      { status: 400 },
    );
  }

  const settings = await getBusinessSettings();
  const vehicle = [order.vehicle_make, order.vehicle_model, order.vehicle_year]
    .filter(Boolean)
    .join(" ");

  const buffer = await renderToBuffer(
    <CotizacionDocument
      isReceipt={isReceipt}
      orderId={order.id}
      createdAt={order.created_at}
      clientName={client?.full_name ?? "Cliente"}
      clientPhone={client?.phone ?? null}
      vehicle={vehicle}
      serviceName={service?.title ?? null}
      materialName={material?.name ?? null}
      colorName={color?.name ?? null}
      description={order.service_description}
      price={price}
      businessName={businessInfo.name}
      businessAddress={businessInfo.address}
      businessPhone={settings.whatsapp}
    />,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${isReceipt ? "recibo" : "cotizacion"}-${order.id.slice(0, 8)}.pdf"`,
    },
  });
}