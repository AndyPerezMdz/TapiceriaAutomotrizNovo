"use client";

import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type LoginMode = "password" | "magic";

const fieldClassName =
  "block min-h-12 w-full rounded-[10px] border-[1.5px] border-[#3d3b36] bg-[#232220] px-3.5 text-base text-[#f5f5f5] outline-none transition placeholder:text-white/30 focus:border-brand-yellow";

function PasswordInput({
  id,
  name,
  disabled,
}: {
  id: string;
  name: string;
  disabled?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        className={`${fieldClassName} pr-12`}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 transition hover:text-white"
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function StaffLoginForm() {
  const router = useRouter();

  const [mode, setMode] = useState<LoginMode>("password");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState
    <Partial<Record<keyof LoginFormData, string>>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [time, setTime] = useState<string | null>(null);
  const [dateLabel, setDateLabel] = useState<string | null>(null);

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/Merida",
        }),
      );
      setDateLabel(
        now.toLocaleDateString("es-MX", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "America/Merida",
        }),
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setFormError(null);
    setFieldErrors({});
    setIsLoading(true);

    const formData = new FormData(form);
    const values = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      setFieldErrors({
        email: errors.email?.[0],
        password: errors.password?.[0],
      });
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      setFormError(getAuthErrorMessage(error));
      setIsLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.role === "cliente") {
      await supabase.auth.signOut();
      setFormError("Esta cuenta no tiene acceso al panel de staff.");
      setIsLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="dark">
      <main className="theme-taller flex min-h-screen flex-wrap bg-[#141413] text-on-ink">
        {/* Reloj checador */}
        <section className="hidden min-w-0 flex-[1_1_480px] flex-col justify-between gap-10 border-r-2 border-dashed border-brand-yellow/25 p-12 lg:flex xl:p-14">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <span className="font-display text-[34px] font-extrabold uppercase leading-none">Novo</span>
            <span className="rounded-[5px] bg-brand-yellow px-2 py-0.5 font-display text-[13px] font-bold uppercase tracking-[0.12em] text-ink">
              Taller
            </span>
          </Link>

          <div>
            <p className="flex items-center gap-2.5 text-[15px] text-on-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full bg-brand-yellow shadow-[0_0_0_4px_rgba(245,197,24,0.2)]" />
              Sistema en línea
            </p>
            <p
              className="mt-3.5 font-display text-[150px] font-extrabold leading-[0.85] tabular-nums"
              aria-label={time ? `Son las ${time}` : undefined}
            >
              {time ?? "--:--"}
            </p>
            <p className="mt-2.5 font-display text-2xl font-semibold uppercase tracking-[0.06em] text-[#d9d5cc]">
              {dateLabel ?? "\u00a0"}
            </p>
          </div>

          <p className="text-[13px] text-on-ink-muted">Acceso exclusivo para el equipo del taller</p>
        </section>

        {/* Formulario */}
        <div className="flex min-w-0 flex-[1_1_480px] items-start justify-center px-5 py-12 sm:items-center sm:px-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-8 flex items-center gap-2.5 lg:hidden">
              <span className="font-display text-3xl font-extrabold uppercase leading-none">Novo</span>
              <span className="rounded-[5px] bg-brand-yellow px-2 py-0.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink">
                Taller
              </span>
              {time ? <span className="ml-auto font-code text-sm text-on-ink-muted">{time}</span> : null}
            </div>

            <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-[56px]">
              Panel de staff
            </h1>
            <p className="mt-2.5 text-base text-on-ink-muted">Entra con tu cuenta de equipo.</p>

            <div
              role="group"
              aria-label="Forma de entrar"
              className="mb-6 mt-7 grid grid-cols-2 gap-1.5 rounded-[14px] bg-[#232220] p-1.5"
            >
              <button
                type="button"
                aria-pressed={mode === "password"}
                onClick={() => setMode("password")}
                className={`min-h-11 rounded-[10px] text-[15px] transition ${
                  mode === "password" ? "bg-brand-yellow font-bold text-ink" : "font-medium text-[#d9d5cc] hover:text-white"
                }`}
              >
                Contraseña
              </button>
              <button
                type="button"
                aria-pressed={mode === "magic"}
                onClick={() => setMode("magic")}
                className={`min-h-11 rounded-[10px] text-[15px] transition ${
                  mode === "magic" ? "bg-brand-yellow font-bold text-ink" : "font-medium text-[#d9d5cc] hover:text-white"
                }`}
              >
                Sin contraseña
              </button>
            </div>

          {mode === "password" ? (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {formError ? (
                <div role="alert" className="rounded-[10px] border-[1.5px] border-brand-red-dark bg-brand-red/10 px-4 py-3 text-[15px] text-[#ffb4b4]">
                  {formError}
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-[15px] font-semibold text-[#e6e3dc]">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={fieldClassName}
                  disabled={isLoading}
                />
                {fieldErrors.email ? (
                  <p className="mt-1.5 text-sm text-[#ffb4b4]">{fieldErrors.email}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[15px] font-semibold text-[#e6e3dc]">
                  Contraseña
                </label>
                <PasswordInput id="password" name="password" disabled={isLoading} />
                {fieldErrors.password ? (
                  <p className="mt-1.5 text-sm text-[#ffb4b4]">{fieldErrors.password}</p>
                ) : null}
              </div>

              <div className="text-right">
                <a
                  href="/staff/recuperar"
                  className="inline-flex min-h-11 items-center text-sm font-medium text-brand-yellow underline-offset-4 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand-yellow px-6 text-[17px] font-bold text-ink transition hover:bg-[#e8b90f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Verificando…" : "Entrar al taller"}
              </button>
            </form>
          ) : (
            <MagicLinkForm redirectPath="/admin" />
          )}

            <div className="mt-7 border-t-2 border-dashed border-[#37352f]" />
            <p className="mt-4 text-sm leading-relaxed text-on-ink-muted">
              ¿Eres nuevo? Pide al admin una invitación; te llega por correo para crear tu
              contraseña.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
