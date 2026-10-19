import { StorageImage } from "@/components/shared/StorageImage";
import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
import { createClient } from "@/lib/supabase/server";
import { User } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 15;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function AdminClientesPage({ searchParams }: Props) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone, avatar_url, created_at", {
      count: "exact",
    })
    .eq("role", "cliente")
    .order("full_name", { ascending: true });

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const start = (page - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);

  const { data: clients, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(targetPage));
    return `/admin/clientes?${params.toString()}`;
  }

  return (
    <div>
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-6 text-foreground">
        Clientes
      </h1>

      <div className="mb-6">
        <SearchBar placeholder="Buscar por nombre, correo o teléfono..." />
      </div>

      {!clients || clients.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-field-border bg-surface p-16 text-center">
          <p className="text-muted">No se encontraron clientes.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clientes/${client.id}`}
                className="flex items-center gap-3 rounded-2xl bg-surface p-5 sm:p-6 transition hover:border-brand-yellow-dark dark:hover:border-brand-yellow dark:ring-1 dark:ring-white/5"
              >
                {client.avatar_url ? (
                  <StorageImage src={client.avatar_url} alt="" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-highlight text-[15px] font-semibold text-yellow-text">
                    {client.full_name?.charAt(0).toUpperCase() ?? <User size={16} />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{client.full_name}</p>
                  <p className="truncate text-[13px] text-muted">
                    {client.email} {client.phone ? `· ${client.phone}` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}