import { ContactStatusButton } from "@/components/admin/ContactStatusButton";
import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
import { WhatsAppLink } from "@/components/shared/WhatsAppLink";
import { buildWhatsAppLink } from "@/lib/constants/business";
import { createClient } from "@/lib/supabase/server";
import { Download, Phone } from "lucide-react";

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminContactosPage({ searchParams }: Props) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();

  let query = supabase
    .from("contact_submissions")
    .select("id, name, phone, message, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,message.ilike.%${q}%`);
  }

  const start = (page - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);

  const { data: submissions, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/admin/contactos?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl text-foreground">
          Mensajes de contacto
        </h1>
        <a
          href="/api/admin/export/contactos"
          className="flex items-center gap-1.5 rounded-xl border-[1.5px] border-field-border px-3 py-2 text-[15px] font-medium text-foreground transition hover:bg-black/5 dark:hover:bg-white/5 min-h-11"
        >
          <Download size={15} /> Exportar CSV
        </a>
      </div>

      <div className="mb-6">
        <SearchBar placeholder="Buscar por nombre o mensaje..." />
      </div>

      {!submissions || submissions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-16 text-center">
          <p className="text-muted">No hay mensajes todavía.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {submissions.map((s) => {
              const whatsappHref = buildWhatsAppLink(
                `Hola ${s.name}, te contactamos por tu mensaje en nuestro sitio web.`,
                s.phone,
              );

              const isNew = s.status === "nuevo";

              return (
                <div
                  key={s.id}
                  className={`rounded-2xl border bg-surface p-4 transition ${
                    isNew
                      ? "border-brand-yellow/40"
                      : "border-seam opacity-80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{s.name}</p>
                      <p className="text-[13px] text-muted">
                        {new Date(s.created_at).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "America/Merida",
                        })}
                      </p>
                    </div>
                    <ContactStatusButton id={s.id} status={s.status} />
                  </div>

                  <p className="mt-2 flex items-center gap-1.5 text-[15px] text-muted">
                    <Phone size={14} /> {s.phone}
                  </p>
                  <p className="mt-2 break-words text-[15px] text-foreground">{s.message}</p>

                  <div className="mt-3">
                    <WhatsAppLink href={whatsappHref} label="Contactar por WhatsApp" />
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}