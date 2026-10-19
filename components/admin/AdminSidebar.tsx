"use client";

import {
  Award,
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronDown,
  ClipboardList,
  HelpCircle,
  History,
  ImageIcon,
  LayoutDashboard,
  Lightbulb,
  Mail,
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
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type BadgeKey = "pending" | "complaints";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
  badgeKey?: BadgeKey;
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
      { href: "/admin/pedidos", label: "Pedidos", icon: ClipboardList, badgeKey: "pending" },
      { href: "/admin/clientes", label: "Clientes", icon: Users2 },
      { href: "/admin/citas", label: "Citas", icon: Calendar },
      { href: "/admin/quejas", label: "Quejas", icon: AlertTriangle, badgeKey: "complaints" },
      { href: "/admin/sugerencias", label: "Sugerencias", icon: Lightbulb },
    ],
  },
  {
    title: "Contenido y promociones",
    items: [
      { href: "/admin/servicios", label: "Servicios", icon: Wrench },
      { href: "/admin/galeria", label: "Galería", icon: ImageIcon },
      { href: "/admin/faqs", label: "Preguntas frecuentes", icon: HelpCircle },
      { href: "/admin/cupones", label: "Cupones", icon: Tag, adminOnly: true },
      { href: "/admin/puntos", label: "Puntos", icon: Award, adminOnly: true },
      { href: "/admin/referidos", label: "Referidos", icon: Users, adminOnly: true },
      { href: "/admin/marketing", label: "Correo promocional", icon: Mail, adminOnly: true },
      { href: "/admin/resenas", label: "Reseñas", icon: Star },
      { href: "/admin/contactos", label: "Contactos", icon: MessageSquare },
    ],
  },
  {
    title: "Administración",
    items: [
      { href: "/admin/reportes", label: "Reportes", icon: BarChart3, adminOnly: true },
      { href: "/admin/historial", label: "Historial", icon: History },
      { href: "/admin/usuarios", label: "Usuarios", icon: Users, adminOnly: true },
      { href: "/admin/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
    ],
  },
];

export function AdminSidebar({
  isAdmin,
  pendingCount,
  complaintsCount,
}: {
  isAdmin: boolean;
  pendingCount: number;
  complaintsCount: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const badgeValues: Record<BadgeKey, number> = {
    pending: pendingCount,
    complaints: complaintsCount,
  };

  function toggleGroup(title: string) {
    setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="fixed left-4 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-brand-yellow shadow-md lg:hidden dark:ring-1 dark:ring-white/10"
      >
        <Menu size={18} />
      </button>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 transform bg-ink text-on-ink transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col overflow-y-auto px-4 py-7">
          <div className="flex items-center justify-between px-2.5">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image
                src="/images/logo-amarillo-wbg.png"
                alt="Tapicería Automotriz by NOVO"
                width={160}
                height={64}
                className="h-auto w-[112px]"
              />
              <span className="rounded-[5px] bg-brand-yellow px-1.5 py-0.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink">
                Taller
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-on-ink-muted hover:bg-white/5 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mx-2.5 mb-5 mt-5 border-t-2 border-dashed border-brand-yellow/50" />

          <nav aria-label="Administración" className="flex-1">
            {groups.map((group) => {
              const visibleItems = group.items.filter((i) => !i.adminOnly || isAdmin);
              if (visibleItems.length === 0) return null;
              const isCollapsed = collapsed[group.title];

              return (
                <div key={group.title} className="mb-1">
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className="flex min-h-9 w-full items-center justify-between rounded-md px-3 text-[11px] uppercase tracking-[0.16em] text-on-ink-muted transition hover:text-on-ink"
                  >
                    {group.title}
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${isCollapsed ? "-rotate-90" : ""}`}
                    />
                  </button>

                  {!isCollapsed ? (
                    <div className="mb-4 mt-0.5 space-y-0.5">
                      {visibleItems.map((item) => {
                        const isActive = pathname === item.href;
                        const badgeValue = item.badgeKey ? badgeValues[item.badgeKey] : 0;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[15px] transition ${
                              isActive
                                ? "bg-brand-yellow font-semibold text-ink"
                                : "text-[#e6e3dc] hover:bg-white/5"
                            }`}
                          >
                            <item.icon size={18} className="shrink-0" />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {badgeValue > 0 ? (
                              <span className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-bold ${isActive ? "bg-ink text-brand-yellow" : "bg-brand-red text-white"}`}>
                                {badgeValue}
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