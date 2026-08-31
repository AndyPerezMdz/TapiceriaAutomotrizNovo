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
      "id, client_id, created_at, status, estimated_price, final_price, vehicle_make, vehicle_model, vehicle_year, service_description, profiles!orders_client_id_fkey(full_name, phone), coupons(title)",
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

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "price, services(title), material_types(name), material_colors(name)",
    )
    .eq("order_id", id)
    .order("order", { ascending: true });

  const client = order.profiles as unknown as {
    full_name: string;
    phone: string | null;
  } | null;
  const coupon = order.coupons as unknown as { title: string } | null;

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

  const formattedItems = (items ?? []).map((item) => {
    const service = item.services as unknown as { title: string } | null;
    const material = item.material_types as unknown as { name: string } | null;
    const color = item.material_colors as unknown as { name: string } | null;
    return {
      title: service?.title ?? "Servicio",
      materialLabel:
        material?.name && color?.name
          ? `${material.name} · ${color.name}`
          : material?.name ?? null,
      price: item.price,
    };
  });

  const buffer = await renderToBuffer(
    <CotizacionDocument
      isReceipt={isReceipt}
      orderId={order.id}
      createdAt={order.created_at}
      clientName={client?.full_name ?? "Cliente"}
      clientPhone={client?.phone ?? null}
      vehicle={vehicle}
      items={formattedItems}
      description={order.service_description}
      totalPrice={price}
      couponTitle={coupon?.title ?? null}
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