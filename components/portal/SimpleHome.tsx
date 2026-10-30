import { Stamp } from "@/components/taller";
import { Car, ChevronRight, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";

export interface SimpleOrder {
  id: string;
  vehicle: string;
  statusLabel: string;
  /** "Costura · paso 3 de 4" o null si no hay etapas. */
  stageText: string | null;
  price: number | null;
}

interface Props {
  firstName: string | null;
  quotes: SimpleOrder[];
  inShop: SimpleOrder[];
  reviewing: SimpleOrder[];
  whatsappHref: string;
}

const more = [
  { href: "/portal/pedidos", label: "Todos mis pedidos" },
  { href: "/portal/mis-citas", label: "Mis citas" },
  { href: "/portal/cupones", label: "Cupones" },
  { href: "/portal/puntos", label: "Puntos" },
  { href: "/portal/referidos", label: "Invitar a un amigo" },
  { href: "/portal/quejas", label: "Quejas" },
  { href: "/portal/perfil", label: "Mi perfil" },
];

/** Inicio del portal en modo sencillo: pocas cosas, grandes y claras. */
export function SimpleHome({ firstName, quotes, inShop, reviewing, whatsappHref }: Props) {
  const myCarHref = inShop.length === 1 ? `/portal/pedidos/${inShop[0].id}` : "/portal/pedidos";
  const big =
    "flex min-h-[84px] w-full items-center gap-4 rounded-2xl px-5 text-left text-[1.375rem] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-yellow";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-6xl">
        Hola{firstName ? `, ${firstName}` : ""}
      </h1>

      {quotes.map((o) => (
        <Link
          key={o.id}
          href={`/portal/pedidos/${o.id}`}
          className="block rounded-2xl bg-brand-yellow p-5 text-ink sm:p-6"
        >
          <p className="text-[1.0625rem] font-semibold">Tu cotización está lista · {o.vehicle}</p>
          {o.price ? (
            <p className="mt-1 font-display text-[2.5rem] font-extrabold leading-none">
              ${o.price.toLocaleString("es-MX")}
            </p>
          ) : null}
          <span className="mt-4 inline-flex min-h-14 items-center gap-2 rounded-xl bg-ink px-5 text-[1.125rem] font-bold text-brand-yellow">
            Revisar y responder <ChevronRight size={22} />
          </span>
        </Link>
      ))}

      <nav aria-label="Acciones principales" className="space-y-3">
        <Link href="/portal/nuevo-pedido" className={`${big} bg-brand-yellow text-ink hover:bg-[#e8b90f]`}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink text-brand-yellow">
            <Plus size={28} strokeWidth={2.6} />
          </span>
          Pedir una cotización
        </Link>
        <Link href={myCarHref} className={`${big} bg-ink text-on-ink hover:bg-ink-soft dark:ring-1 dark:ring-white/10`}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-ink">
            <Car size={26} />
          </span>
          Ver cómo va mi coche
        </Link>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${big} border-2 border-foreground text-foreground hover:bg-black/5 dark:hover:bg-white/5`}
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
            <MessageCircle size={26} />
          </span>
          Escribir por WhatsApp
        </a>
      </nav>

      {inShop.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-[2rem] font-extrabold uppercase leading-none text-foreground">
            Tu coche en el taller
          </h2>
          {inShop.map((o) => (
            <Link
              key={o.id}
              href={`/portal/pedidos/${o.id}`}
              className="block rounded-2xl bg-surface p-5 dark:ring-1 dark:ring-white/5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-[1.375rem] font-bold text-foreground">{o.vehicle}</p>
                <Stamp label={o.statusLabel} size="sm" tone="ink" />
              </div>
              {o.stageText ? (
                <p className="mt-2 text-[1.125rem] text-foreground">
                  Va en: <strong>{o.stageText}</strong>
                </p>
              ) : null}
              <span className="mt-3 inline-flex min-h-12 items-center gap-1 text-[1.0625rem] font-bold text-foreground underline underline-offset-4">
                Ver detalle <ChevronRight size={20} />
              </span>
            </Link>
          ))}
        </section>
      ) : null}

      {reviewing.length > 0 ? (
        <section className="rounded-2xl bg-surface p-5 dark:ring-1 dark:ring-white/5">
          <h2 className="text-[1.25rem] font-bold text-foreground">Estamos revisando tu solicitud</h2>
          <p className="mt-1 text-[1.0625rem] text-muted">
            {reviewing.map((o) => o.vehicle).join(", ")}: te avisamos cuando tengamos el precio.
          </p>
        </section>
      ) : null}

      <details className="group rounded-2xl border-2 border-dashed border-field-border">
        <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between px-5 text-[1.125rem] font-bold text-foreground">
          Más opciones
          <ChevronRight size={22} className="transition group-open:rotate-90" />
        </summary>
        <ul className="border-t-2 border-dashed border-field-border px-2 py-2">
          {more.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                className="flex min-h-14 items-center justify-between rounded-xl px-3 text-[1.0625rem] text-foreground hover:bg-black/5 dark:hover:bg-white/5"
              >
                {m.label}
                <ChevronRight size={20} className="text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </details>

      <p className="text-center text-[0.9375rem] text-muted">
        ¿Prefieres ver todo?{" "}
        <Link href="/portal/perfil?tab=accesibilidad" className="font-semibold text-foreground underline underline-offset-4">
          Cambia a la vista completa
        </Link>
      </p>
    </div>
  );
}
