"use client";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/galeria", label: "Galería" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function Header() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const logoSrc = isDark
    ? "/images/logo-amarillo-wbg.png"
    : "/images/logo-negro-wbg.png";

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-surface/90 backdrop-blur-md dark:border-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center">
          {mounted ? (
            <Image
              src={logoSrc}
              alt="Tapicería Automotriz by NOVO"
              width={160}
              height={64}
              priority
              className="h-auto w-[120px]"
            />
          ) : (
            <div className="h-[48px] w-[120px]" />
          )}
        </Link>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-foreground/80 transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black dark:hover:bg-white/85"
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Botón menú móvil */}
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center text-foreground md:hidden"
          aria-label="Abrir menú"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Menú móvil */}
      {menuOpen ? (
        <div className="border-t border-black/10 bg-surface px-6 py-4 dark:border-white/10 md:hidden">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-medium text-foreground/80"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
              <ThemeToggle />
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-md bg-brand-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-brand-black"
              >
                Iniciar sesión
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}