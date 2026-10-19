import { AdminOrderRow } from "@/components/admin/AdminOrderRow";
import { WhatsAppLink } from "@/components/shared/WhatsAppLink";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft, Mail, Phone, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminClienteDetallePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: client }, { data: orders }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, phone, avatar_url, created_at")
      .eq("id", id)
      .eq("role", "cliente")
      .single(),
    supabase
      .from("orders")
      .select("id, vehicle_make, vehicle_model, status, created_at, deleted_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) {
    notFound();
  }

  const whatsappHref = client.phone
    ? buildWhatsAppLink(
        `Hola ${client.full_name}, te contactamos de Tapicería NOVO.`,
        client.phone,
      )
    : null;

  const formattedOrders = (orders ?? []).map((o) => ({ ...o, client_name: client.full_name }));

  return (
    <div>
      <Link
        href="/admin/clientes"
        className="mb-6 inline-flex items-center gap-1.5 text-[15px] font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver a clientes
      </Link>

      <div className="mb-8 flex items-center gap-4">
        {client.avatar_url ? (
          <img
            src={client.avatar_url}
            alt=""
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-highlight text-xl font-semibold text-yellow-text">
            {client.full_name?.charAt(0).toUpperCase() ?? <User size={22} />}
          </div>
        )}
        <div>
          <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl text-foreground">
            {client.full_name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-[15px] text-muted">
            <span className="flex items-center gap-1">
              <Mail size={13} /> {client.email}
            </span>
            {client.phone ? (
              <span className="flex items-center gap-1">
                <Phone size={13} /> {client.phone}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {whatsappHref ? (
        <div className="mb-8">
          <WhatsAppLink href={whatsappHref} label="Contactar por WhatsApp" />
        </div>
      ) : null}

      <h2 className="font-display text-2xl font-bold uppercase mb-4 text-foreground">
        Historial de pedidos ({formattedOrders.length})
      </h2>

      {formattedOrders.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-10 text-center">
          <p className="text-[15px] text-muted">Este cliente aún no tiene pedidos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {formattedOrders.map((order) => (
            <AdminOrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}