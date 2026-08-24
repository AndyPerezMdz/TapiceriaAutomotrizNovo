import { GalleryAdminGrid } from "@/components/admin/GalleryAdminGrid";
import { Pagination } from "@/components/shared/Pagination";
import { SearchBar } from "@/components/shared/SearchBar";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";

const PAGE_SIZE = 12;

interface Props {
  searchParams: Promise<{ page?: string; q?: string; service?: string }>;
}

export default async function AdminGaleriaPage({ searchParams }: Props) {
  const { page: pageParam, q, service } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: myProfile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const isAdmin = myProfile?.role === "admin";

  const { data: services } = await supabase
    .from("services")
    .select("id, title")
    .order("order", { ascending: true });

  let query = supabase
    .from("gallery_items")
    .select("id, image_before_url, image_after_url, caption, service_id", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.ilike("caption", `%${q}%`);
  }
  if (service) {
    query = query.eq("service_id", service);
  }

  const start = (page - 1) * PAGE_SIZE;
  query = query.range(start, start + PAGE_SIZE - 1);

  const { data: items, count } = await query;
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (service) params.set("service", service);
    params.set("page", String(targetPage));
    return `/admin/galeria?${params.toString()}`;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Galería
        </h1>
        {isAdmin ? (
          <Link
            href="/admin/galeria/nueva"
            className="flex items-center gap-1.5 rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
          >
            <Plus size={16} /> Agregar foto
          </Link>
        ) : null}
      </div>

      <div className="mb-4 flex gap-2">
        <div className="flex-1">
          <SearchBar placeholder="Buscar por descripción..." />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        
          href="/admin/galeria"
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            !service
              ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
              : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
          }`}
        >
          Todos
        </a>
        {services?.map((s) => (
          
            key={s.id}
            href={`/admin/galeria?service=${s.id}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              service === s.id
                ? "bg-brand-black text-white dark:bg-white dark:text-brand-black"
                : "border border-black/15 text-muted hover:border-black/30 dark:border-white/15"
            }`}
          >
            {s.title}
          </a>
        ))}
      </div>

      <GalleryAdminGrid items={items ?? []} isAdmin={isAdmin} />

      <Pagination currentPage={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}