import { ServiceOrderButton } from "@/components/admin/ServiceOrderButtons";
import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminServiciosPage() {
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
    .select("id, title, slug, is_active, order")
    .order("order", { ascending: true });

  const list = services ?? [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl text-foreground">
          Servicios
        </h1>
        {isAdmin ? (
          <Link
            href="/admin/servicios/nuevo"
            className="flex items-center gap-1.5 rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-4 py-2 text-[15px] font-semibold text-ink transition min-h-11"
          >
            <Plus size={16} /> Nuevo servicio
          </Link>
        ) : null}
      </div>

      <div className="space-y-2">
        {list.map((service, index) => {
          const prev = index > 0 ? list[index - 1] : null;
          const next = index < list.length - 1 ? list[index + 1] : null;

          return (
            <div
              key={service.id}
              className="flex items-center gap-2 rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5"
            >
              {isAdmin ? (
                <div className="flex flex-col">
                  <ServiceOrderButton
                    serviceId={service.id}
                    currentOrder={service.order}
                    neighborId={prev?.id ?? null}
                    neighborOrder={prev?.order ?? null}
                    disabled={!prev}
                  />
                  <ServiceOrderButton
                    serviceId={service.id}
                    currentOrder={service.order}
                    neighborId={next?.id ?? null}
                    neighborOrder={next?.order ?? null}
                    disabled={!next}
                  />
                </div>
              ) : null}

              {isAdmin ? (
                <Link
                  href={`/admin/servicios/${service.id}`}
                  className="flex flex-1 items-center justify-between transition hover:opacity-80"
                >
                  <span className="font-medium text-foreground">{service.title}</span>
                  <span
                    className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] ${
                      service.is_active
                        ? "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40"
                        : "border-[1.5px] border-muted text-muted"
                    }`}
                  >
                    {service.is_active ? "Activo" : "Inactivo"}
                  </span>
                </Link>
              ) : (
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium text-foreground">{service.title}</span>
                  <span
                    className={`rounded-md px-2.5 py-1 font-display text-sm font-bold uppercase leading-none tracking-[0.08em] ${
                      service.is_active
                        ? "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40"
                        : "border-[1.5px] border-muted text-muted"
                    }`}
                  >
                    {service.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}