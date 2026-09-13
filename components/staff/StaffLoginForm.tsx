"use client";

import { BrandLogo } from "@/components/auth/BrandLogo";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginFormData } from "@/lib/validations/auth";
import { Calendar, ClipboardList, Eye, EyeOff, Users, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoginMode = "password" | "magic";

const fieldClassName =
  "w-full rounded-md border border-white/15 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow";

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
        className={`${fieldClassName} pr-10`}
        disabled={disabled}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 transition hover:text-white"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
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

  useEffect(() => {
    function updateClock() {
      setTime(
        new Date().toLocaleTimeString("es-MX", {
          hour: "numeric",
          minute: "2-digit",
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-black px-4 py-12">
      {/* Textura de fondo sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-yellow/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* Indicador "en vivo" */}
        <div className="mb-5 flex items-center justify-center gap-2 text-xs text-white/50">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
          </span>
          Sistema en línea{time ? ` · ${time}` : ""}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-sm">
          <div className="mb-6 flex justify-center">
            <BrandLogo />
          </div>

          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">Panel de staff</h1>
            <p className="mt-1.5 text-sm text-white/50">Acceso exclusivo para el equipo</p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-1 rounded-md border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`rounded-sm py-1.5 text-sm font-medium transition ${
                mode === "password"
                  ? "bg-brand-yellow text-brand-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Contraseña
            </button>
            <button
              type="button"
              onClick={() => setMode("magic")}
              className={`rounded-sm py-1.5 text-sm font-medium transition ${
                mode === "magic"
                  ? "bg-brand-yellow text-brand-black"
                  : "text-white/50 hover:text-white"
              }`}
            >
              Sin contraseña
            </button>
          </div>

          {mode === "password" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
                  {formError}
                </div>
              ) : null}

              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/80">
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
                  <p className="mt-1 text-sm text-red-300">{fieldErrors.email}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-white/80">
                  Contraseña
                </label>
                <PasswordInput id="password" name="password" disabled={isLoading} />
                {fieldErrors.password ? (
                  <p className="mt-1 text-sm text-red-300">{fieldErrors.password}</p>
                ) : null}
              </div>

              <div className="text-right">
                <a
                  href="/staff/recuperar"
                  className="text-sm font-medium text-white/60 underline-offset-4 hover:text-white hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md bg-brand-yellow px-4 py-2.5 text-sm font-semibold text-brand-black transition hover:bg-brand-yellow-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Verificando..." : "Iniciar sesión"}
              </button>
            </form>
          ) : (
            <MagicLinkForm redirectPath="/admin" />
          )}
        </div>

        {/* Íconos decorativos, dan contexto de qué hay dentro */}
        <div className="mt-6 flex justify-center gap-6 text-white/25">
          <ClipboardList size={16} />
          <Calendar size={16} />
          <Users size={16} />
          <Wrench size={16} />
        </div>
      </div>
    </main>
  );
}