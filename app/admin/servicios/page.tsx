import { createClient } from "@/lib/supabase/server";
import { Plus } from "lucide-react";
import Link from "next/link";

export default async function AdminServiciosPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from("services")
    .select("id, title, slug, is_active")
    .order("order", { ascending: true });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Servicios
        </h1>
        <Link
          href="/admin/servicios/nuevo"
          className="flex items-center gap-1.5 rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
        >
          <Plus size={16} /> Nuevo servicio
        </Link>
      </div>

      <div className="space-y-2">
        {services?.map((service) => (
          <Link
            key={service.id}
            href={`/admin/servicios/${service.id}`}
            className="flex items-center justify-between rounded-lg border border-black/10 bg-surface p-4 transition hover:border-brand-yellow-dark dark:border-white/10 dark:hover:border-brand-yellow"
          >
            <span className="font-medium text-foreground">{service.title}</span>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                service.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              }`}
            >
              {service.is_active ? "Activo" : "Inactivo"}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}