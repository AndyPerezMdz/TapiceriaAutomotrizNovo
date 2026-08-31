"use client";

import { FooterLogo } from "@/components/FooterLogo";
import {
  Award,
  CalendarDays,
  ChevronDown,
  Gift,
  History,
  LayoutDashboard,
  PlusCircle,
  Tag,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/portal", label: "Mis pedidos", icon: LayoutDashboard },
      { href: "/portal/nuevo-pedido", label: "Nuevo pedido", icon: PlusCircle },
    ],
  },
  {
    title: "Seguimiento",
    items: [
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
    items: [{ href: "/portal/perfil", label: "Mi perfil", icon: User }],
  },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-surface lg:block dark:border-white/10">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto p-4">
        <div className="mb-6 px-1">
          <Link href="/portal">
            <FooterLogo />
          </Link>
        </div>

        <nav className="flex-1">
          {groups.map((group) => {
            const isCollapsed = collapsed[group.title];

            return (
              <div key={group.title} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.title)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted transition hover:text-foreground"
                >
                  {group.title}
                  <ChevronDown
                    size={12}
                    className={`transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                  />
                </button>

                {!isCollapsed ? (
                  <div className="mb-3 mt-1 space-y-0.5">
                    {group.items.map((item) => {
                      const isActive =
                        item.href === "/portal"
                          ? pathname === "/portal"
                          : pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition ${
                            isActive
                              ? "bg-brand-yellow/15 font-medium text-brand-yellow-dark dark:text-brand-yellow"
                              : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <item.icon size={16} className="shrink-0" />
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}