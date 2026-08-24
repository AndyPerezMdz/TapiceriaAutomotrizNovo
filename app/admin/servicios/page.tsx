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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Servicios
        </h1>
        {isAdmin ? (
          <Link
            href="/admin/servicios/nuevo"
            className="flex items-center gap-1.5 rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
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
              className="flex items-center gap-2 rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10"
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
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      service.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {service.is_active ? "Activo" : "Inactivo"}
                  </span>
                </Link>
              ) : (
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium text-foreground">{service.title}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      service.is_active
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
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