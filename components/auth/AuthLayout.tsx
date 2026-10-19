import { BrandLogo } from "@/components/auth/BrandLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import Link from "next/link";
import { buttonClass, fieldClass } from "@/components/taller";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  /** Texto pequeño sobre el título. */
  eyebrow?: string;
  children: ReactNode;
  footer: ReactNode;
  /** Título grande del panel negro (escritorio). */
  panelTitle?: ReactNode;
  panelBody?: string;
  /** Contenido extra del panel negro (horario, pasos…). */
  panelExtra?: ReactNode;
  /** Se muestra solo en celular, debajo del formulario. */
  mobileExtra?: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  eyebrow = "Portal del cliente",
  children,
  footer,
  panelTitle = (
    <>
      Pasión por
      <br />
      el detalle.
    </>
  ),
  panelBody = "Sigue tu pedido desde la cotización hasta que te entregamos el coche.",
  panelExtra,
  mobileExtra,
}: AuthLayoutProps) {
  return (
    <main className="theme-taller grid min-h-screen bg-background text-foreground lg:grid-cols-2">
      {/* Panel de marca — solo escritorio */}
      <div className="relative hidden overflow-hidden bg-ink text-on-ink lg:block">
        <Image
          src="/images/auth-background.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover opacity-45 contrast-125 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink from-[8%] via-ink/55 to-ink/80" />

        <div className="relative z-10 flex h-full flex-col justify-between gap-10 p-12 xl:p-14">
          <Link href="/" className="block w-fit">
            <p className="font-display text-[34px] font-extrabold uppercase leading-none">Novo</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-on-ink-muted">
              Tapicería automotriz · Mérida
            </p>
          </Link>

          <div className="max-w-md">
            <h2 className="font-display text-6xl font-extrabold uppercase leading-[0.92] xl:text-[76px]">
              {panelTitle}
            </h2>
            {panelBody ? (
              <p className="mt-5 text-[17px] leading-relaxed text-[#d9d5cc]">{panelBody}</p>
            ) : null}
            {panelExtra ? <div className="mt-8">{panelExtra}</div> : null}
          </div>

          <p className="text-[13px] text-on-ink-muted">Trabajo hecho a mano en Mérida, Yucatán</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="relative flex items-start justify-center px-5 pb-12 pt-10 sm:items-center sm:px-10 sm:py-14">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo />
          </div>

          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-yellow-text">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-[56px]">
            {title}
          </h1>
          {subtitle ? <p className="mt-2.5 text-base text-muted">{subtitle}</p> : null}

          <div className="mt-7">{children}</div>

          <div className="mt-8 text-center text-[15px] text-muted">{footer}</div>

          {mobileExtra ? <div className="mt-8 lg:hidden">{mobileExtra}</div> : null}
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
      className="font-bold text-foreground underline-offset-4 hover:underline"
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
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-semibold text-foreground">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1.5 text-sm text-brand-red-dark dark:text-brand-red">{error}</p> : null}
    </div>
  );
}

export const inputClassName = fieldClass;

export const submitButtonClassName = `${buttonClass("primary", "lg")} w-full !text-[17px] !font-bold`;

export const secondaryButtonClassName = `${buttonClass("outline", "lg")} w-full`;

export const formErrorClassName =
  "rounded-xl border-[1.5px] border-brand-red-dark/40 bg-brand-red/5 px-4 py-3 text-[15px] text-brand-red-dark dark:text-brand-red";
