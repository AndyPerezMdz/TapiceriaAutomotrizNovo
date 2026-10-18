"use client";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Award, Gift, Tag, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";

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
    { href: "/portal/referidos", label: "Referidos", icon: Gift },
    { href: "/portal/quejas", label: "Quejas", icon: AlertTriangle },
    { href: "/portal/sugerencias", label: "Sugerencias", icon: Lightbulb },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 lg:hidden">
      <div
        ref={ref}
        className="w-full rounded-t-[22px] bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] dark:ring-1 dark:ring-white/10"
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="font-display text-2xl font-bold uppercase text-foreground">Más opciones</p>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-black/5 dark:hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-base text-foreground transition hover:bg-black/5 dark:hover:bg-white/5"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between border-t-2 border-dashed border-seam pt-3">
          <span className="px-3 text-base text-foreground">Apariencia</span>
          <ThemeToggle />
        </div>

        <div className="mt-1 px-3">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}