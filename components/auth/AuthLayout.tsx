import { BrandLogo } from "@/components/auth/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Panel izquierdo — solo visible en desktop */}
      <div className="relative hidden overflow-hidden bg-brand-black lg:block">
        <Image
          src="/images/auth-background.jpg"
          alt=""
          fill
          priority
          className="object-cover grayscale contrast-125 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/40 to-brand-black/70" />

        <div className="relative z-10 flex h-full flex-col justify-between p-12 xl:p-16">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-yellow">
            Tapicería Automotriz by NOVO
          </span>

          <div className="max-w-md">
            <h2 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Pasión por el detalle.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/60">
              Seguimiento profesional de cada pedido, desde la cotización
              hasta la entrega de tu vehículo.
            </p>
          </div>

          <p className="text-xs text-white/40">
            Mérida, Yucatán · Desde el trabajo hecho a mano
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="relative flex items-start justify-center bg-background px-6 pb-12 pt-10 sm:items-center sm:px-10 sm:py-12">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center sm:mb-10">
            <BrandLogo />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
            ) : null}
          </div>

          {children}

          <div className="mt-8 border-t border-black/10 pt-6 text-center text-sm text-muted dark:border-white/10">
            {footer}
          </div>
        </div>
      </div>
    </main>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-semibold text-foreground underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

export function AuthField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-sm text-brand-red">{error}</p> : null}
    </div>
  );
}

export const inputClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15 dark:focus:border-white dark:focus:ring-white";

export const submitButtonClassName =
  "w-full rounded-md border border-transparent bg-brand-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-black/85 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white dark:text-brand-black dark:hover:bg-white/85";

export const formErrorClassName =
  "rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red";