"use client";

import { FooterLogo } from "@/components/FooterLogo";
import {
  Award,
  BarChart3,
  Calendar,
  ChevronDown,
  ClipboardList,
  History,
  ImageIcon,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Settings,
  Star,
  Tag,
  Users,
  Users2,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  badge?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const groups: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/reportes", label: "Reportes", icon: BarChart3, adminOnly: true },
    ],
  },
  {
    title: "Operación",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, badge: true },
      { href: "/admin/clientes", label: "Clientes", icon: Users2 },
      { href: "/admin/citas", label: "Citas", icon: Calendar },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/admin/cupones", label: "Cupones", icon: Tag, adminOnly: true },
      { href: "/admin/puntos", label: "Puntos", icon: Award, adminOnly: true },
      { href: "/admin/resenas", label: "Reseñas", icon: Star },
      { href: "/admin/contactos", label: "Contactos", icon: MessageSquare },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/servicios", label: "Servicios", icon: Wrench },
      { href: "/admin/galeria", label: "Galería", icon: ImageIcon },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/admin/historial", label: "Historial", icon: History },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
      { href: "/admin/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
    ],
  },
];

export function AdminSidebar({
  isAdmin,
  pendingCount,
}: {
  isAdmin: boolean;
  pendingCount: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  function toggleGroup(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="fixed left-4 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-md border border-black/15 bg-surface text-foreground shadow-sm lg:hidden dark:border-white/15"
      >
        <Menu size={18} />
      </button>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 transform border-r border-black/10 bg-surface transition-transform duration-200 lg:static lg:translate-x-0 dark:border-white/10 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto p-4">
          <div className="mb-6 flex items-center justify-between px-1">
            <FooterLogo />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="text-muted lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex-1">
            {groups.map((group) => {
              const visibleItems = group.items.filter((i) => !i.adminOnly || isAdmin);
              if (visibleItems.length === 0) return null;
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
                      {visibleItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition ${
                              isActive
                                ? "bg-brand-yellow/15 font-medium text-brand-yellow-dark dark:text-brand-yellow"
                                : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                            }`}
                          >
                            <item.icon size={16} className="shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {item.badge && pendingCount > 0 ? (
                              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
                                {pendingCount}
                              </span>
                            ) : null}
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
    </>
  );
}