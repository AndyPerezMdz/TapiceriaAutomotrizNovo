"use client";

import {
  Award,
  BarChart3,
  Calendar,
  ClipboardList,
  History,
  ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Search,
  Settings,
  Star,
  Tag,
  User,
  Users,
  Users2,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SearchItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const allItems: SearchItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Reportes", href: "/admin/reportes", icon: BarChart3, adminOnly: true },
  { label: "Pedidos", href: "/admin/pedidos", icon: ClipboardList },
  { label: "Clientes", href: "/admin/clientes", icon: Users2 },
  { label: "Citas", href: "/admin/citas", icon: Calendar },
  { label: "Cupones", href: "/admin/cupones", icon: Tag, adminOnly: true },
  { label: "Puntos de lealtad", href: "/admin/puntos", icon: Award, adminOnly: true },
  { label: "Referidos", href: "/admin/referidos", icon: Users, adminOnly: true },
  { label: "Reseñas", href: "/admin/resenas", icon: Star },
  { label: "Contactos", href: "/admin/contactos", icon: MessageSquare },
  { label: "Servicios", href: "/admin/servicios", icon: Wrench },
  { label: "Galería", href: "/admin/galeria", icon: ImageIcon },
  { label: "Historial de auditoría", href: "/admin/historial", icon: History },
  { label: "Usuarios", href: "/admin/usuarios", icon: Users, adminOnly: true },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings, adminOnly: true },
  { label: "Mi perfil", href: "/admin/perfil", icon: User },
];

export function QuickSearch({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const items = allItems.filter((i) => !i.adminOnly || isAdmin);
  const filtered = query.trim()
    ? items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : items;

  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleGlobalKey);
    return () => document.removeEventListener("keydown", handleGlobalKey);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function go(href: string) {
    router.push(href);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) go(filtered[activeIndex].href);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-black/15 px-3 py-2 text-sm text-muted transition hover:border-black/30 dark:border-white/15 dark:hover:border-white/30"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Buscar...</span>
        <span className="hidden rounded border border-black/15 px-1.5 py-0.5 text-[10px] sm:inline dark:border-white/15">
          Ctrl K
        </span>
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 px-4 pt-24"
          onClick={() => setIsOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-lg border border-black/10 bg-surface shadow-2xl dark:border-white/10"
          >
            <div className="flex items-center gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
              <Search size={16} className="text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar una sección..."
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
              />
              <span className="rounded border border-black/15 px-1.5 py-0.5 text-[10px] text-muted dark:border-white/15">
                Esc
              </span>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-muted">Sin resultados.</p>
              ) : (
                filtered.map((item, index) => (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition ${
                      index === activeIndex
                        ? "bg-brand-yellow/15 text-brand-yellow-dark dark:text-brand-yellow"
                        : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={16} className="shrink-0" />
                    {item.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}