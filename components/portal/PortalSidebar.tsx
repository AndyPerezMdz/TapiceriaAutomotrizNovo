"use client";

import {
  Award,
  CalendarDays,
  Gift,
  History,
  LayoutDashboard,
  Lightbulb,
  MessageSquareWarning,
  PlusCircle,
  Tag,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string | null;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    title: null,
    items: [
      { href: "/portal", label: "Mis pedidos", icon: LayoutDashboard },
      { href: "/portal/nuevo-pedido", label: "Nuevo pedido", icon: PlusCircle },
      { href: "/portal/pedidos", label: "Historial", icon: History },
      { href: "/portal/mis-citas", label: "Mis citas", icon: CalendarDays },
    ],
  },
  {
    title: "Beneficios",
    items: [
      { href: "/portal/cupones", label: "Cupones", icon: Tag },
      { href: "/portal/puntos", label: "Puntos", icon: Award },
      { href: "/portal/referidos", label: "Referidos", icon: Gift },
    ],
  },
  {
    title: "Cuenta",
    items: [
      { href: "/portal/perfil", label: "Mi perfil", icon: User },
      { href: "/portal/quejas", label: "Quejas", icon: MessageSquareWarning },
      { href: "/portal/sugerencias", label: "Sugerencias", icon: Lightbulb },
    ],
  },
];

export function PortalSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
  }

  return (
    <aside className="hidden w-64 shrink-0 bg-ink text-on-ink lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-7">
        <Link href="/portal" className="block px-2.5">
          <Image
            src="/images/logo-amarillo-wbg.png"
            alt="Tapicería Automotriz by NOVO"
            width={160}
            height={64}
            className="h-auto w-[128px]"
          />
        </Link>
        <div className="mx-2.5 mt-5 border-t-2 border-dashed border-brand-yellow/50" />

        <nav aria-label="Portal" className="mt-6 flex-1 space-y-6">
          {groups.map((group) => (
            <div key={group.title ?? "principal"} className="space-y-1">
              {group.title ? (
                <p className="px-3 pb-1 text-[11px] uppercase tracking-[0.16em] text-on-ink-muted">
                  {group.title}
                </p>
              ) : null}
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] transition ${
                      active
                        ? "bg-brand-yellow font-semibold text-ink"
                        : "text-[#e6e3dc] hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={18} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
