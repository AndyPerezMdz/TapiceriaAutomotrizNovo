"use client";

import { CalendarDays, History, LayoutDashboard, Plus, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/portal", label: "Inicio", icon: LayoutDashboard },
  { href: "/portal/pedidos", label: "Pedidos", icon: History },
];

const rightItems = [
  { href: "/portal/mis-citas", label: "Citas", icon: CalendarDays },
  { href: "/portal/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-white/10">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[11px] transition ${
                active ? "text-brand-yellow-dark dark:text-brand-yellow" : "text-muted"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}

        <Link
          href="/portal/nuevo-pedido"
          className="mx-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-brand-black shadow-lg transition hover:scale-105"
          aria-label="Nuevo pedido"
        >
          <Plus size={24} />
        </Link>

        {rightItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[11px] transition ${
                active ? "text-brand-yellow-dark dark:text-brand-yellow" : "text-muted"
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}