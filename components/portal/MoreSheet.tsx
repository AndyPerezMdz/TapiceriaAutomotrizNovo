"use client";

import { Award, Tag, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

export function MoreSheet({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const items = [
    { href: "/portal/cupones", label: "Cupones", icon: Tag },
    { href: "/portal/puntos", label: "Puntos", icon: Award },
    { href: "/portal/perfil", label: "Mi perfil", icon: User },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden">
      <div
        ref={ref}
        className="w-full rounded-t-2xl border-t border-black/10 bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:border-white/10"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">Más opciones</p>
          <button onClick={onClose} className="text-muted">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}