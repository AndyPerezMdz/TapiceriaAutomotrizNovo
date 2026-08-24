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
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Clientes
      </h1>

      <div className="mb-6">
        <SearchBar placeholder="Buscar por nombre, correo o teléfono..." />
      </div>

      {!clients || clients.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 bg-surface p-16 text-center dark:border-white/15">
          <p className="text-muted">No se encontraron clientes.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {clients.map((client) => (
              <Link
                key={client.id}
                href={`/admin/clientes/${client.id}`}
                className="flex items-center gap-3 rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
              >
                {client.avatar_url ? (
                  <img
                    src={client.avatar_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-yellow/20 text-sm font-semibold text-brand-yellow-dark dark:text-brand-yellow">
                    {client.full_name?.charAt(0).toUpperCase() ?? <User size={16} />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{client.full_name}</p>
                  <p className="truncate text-xs text-muted">
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