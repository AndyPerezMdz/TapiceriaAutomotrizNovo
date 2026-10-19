"use client";

import { StorageImage } from "@/components/shared/StorageImage";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, LogOut, Moon, Sun, UserRound } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface Props {
  name: string | null;
  subtitle?: string | null;
  avatarUrl: string | null;
  profileHref: string;
}

/** Menú de cuenta: perfil, tema y cerrar sesión, todo en un solo botón. */
export function UserMenu({ name, subtitle, avatarUrl, profileHref }: Props) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const isDark = mounted && resolvedTheme === "dark";
  const initial = name?.trim().charAt(0).toUpperCase() || "?";
  const firstName = name?.split(" ")[0] ?? "";

  const avatar = (size: number) =>
    avatarUrl ? (
      <StorageImage
        src={avatarUrl}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    ) : (
      <span
        className="flex items-center justify-center rounded-full bg-ink font-display font-bold text-brand-yellow dark:ring-1 dark:ring-white/15"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
      >
        {initial}
      </span>
    );

  const item =
    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-[15px] text-foreground transition hover:bg-black/5 dark:hover:bg-white/5";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de mi cuenta"
        className="flex min-h-11 items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition hover:bg-black/5 dark:hover:bg-white/5"
      >
        {avatar(36)}
        <span className="hidden max-w-[140px] truncate text-[15px] font-semibold text-foreground sm:block">
          {firstName}
        </span>
        <ChevronDown size={16} className={`hidden text-muted transition sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(18rem,calc(100vw-1.5rem))] origin-top-right animate-panel-in overflow-hidden rounded-[18px] bg-surface shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
        >
          <div className="flex items-center gap-3 bg-ink px-4 py-4 text-on-ink">
            {avatar(44)}
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold uppercase leading-none">{name ?? "Mi cuenta"}</p>
              {subtitle ? <p className="mt-1 truncate text-[13px] capitalize text-on-ink-muted">{subtitle}</p> : null}
            </div>
          </div>
          <div className="p-1.5">
            <Link href={profileHref} role="menuitem" onClick={() => setOpen(false)} className={item}>
              <UserRound size={18} /> Mi perfil
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={item}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
              {isDark ? "Modo claro" : "Modo oscuro"}
            </button>
            <div className="my-1.5 border-t-2 border-dashed border-seam" />
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              disabled={signingOut}
              className={`${item} text-brand-red-dark disabled:opacity-60 dark:text-brand-red`}
            >
              <LogOut size={18} /> {signingOut ? "Cerrando sesión…" : "Cerrar sesión"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
