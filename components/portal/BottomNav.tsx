"use client";

import { MoreSheet } from "@/components/portal/MoreSheet";
import { CalendarDays, History, LayoutDashboard, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const leftItems = [
  { href: "/portal", label: "Inicio", icon: LayoutDashboard },
  { href: "/portal/pedidos", label: "Historial", icon: History },
];

const rightItems = [{ href: "/portal/mis-citas", label: "Citas", icon: CalendarDays }];

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    return href === "/portal" ? pathname === "/portal" : pathname.startsWith(href);
  }

  function itemClass(active: boolean) {
    return `flex min-h-14 flex-col items-center justify-center gap-1 rounded-[14px] text-[11px] transition ${
      active ? "bg-brand-yellow font-semibold text-ink" : "text-[#d9d5cc]"
    }`;
  }

  return (
    <>
      <nav
        aria-label="Portal"
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5 rounded-[20px] bg-ink p-2 shadow-[0_8px_30px_rgba(0,0,0,0.25)] dark:ring-1 dark:ring-white/10">
          {leftItems.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass(isActive(item.href))}>
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}

          <Link
            href="/portal/nuevo-pedido"
            aria-label="Nuevo pedido"
            className="flex min-h-14 items-center justify-center"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-brand-yellow ${
                isActive("/portal/nuevo-pedido") ? "bg-brand-yellow text-ink" : "text-brand-yellow"
              }`}
            >
              <Plus size={22} strokeWidth={2.4} />
            </span>
          </Link>

          {rightItems.map((item) => (
            <Link key={item.href} href={item.href} className={itemClass(isActive(item.href))}>
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}

          <button type="button" onClick={() => setMoreOpen(true)} className={itemClass(false)}>
            <MoreHorizontal size={20} />
            Más
          </button>
        </div>
      </nav>

      {moreOpen ? <MoreSheet onClose={() => setMoreOpen(false)} /> : null}
    </>
  );
}
