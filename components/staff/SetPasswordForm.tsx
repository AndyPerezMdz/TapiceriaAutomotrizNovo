"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const fieldClassName =
  "block min-h-12 w-full rounded-[10px] border-[1.5px] border-[#3d3b36] bg-[#1a1a19] px-3.5 text-base text-[#f5f5f5] outline-none transition focus:border-brand-yellow";

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  empleado: "Empleado",
  staff: "Staff",
};

function strengthOf(value: string) {
  if (!value) return 0;
  let score = value.length >= 8 ? 1 : 0;
  if (value.length >= 10 && /[0-9]/.test(value)) score++;
  if (/[A-Z]/.test(value) && /[^A-Za-z0-9]/.test(value)) score++;
  return Math.max(score, value.length >= 8 ? 1 : 0);
}

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setEmail(user.email ?? null);
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (data?.role) setRole(data.role);
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(
        "No se pudo establecer la contraseña. El link puede haber expirado, pide una nueva invitación.",
      );
      setIsSaving(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  const strength = strengthOf(password);
  const matches = confirmPassword.length > 0 && confirmPassword === password;

  return (
    <div className="dark">
      <main className="theme-taller flex min-h-screen items-center justify-center bg-[#141413] px-5 py-12 text-on-ink">
        <div className="w-full max-w-[560px]">
          <div className="flex items-center justify-center gap-2.5">
            <span className="font-display text-3xl font-extrabold uppercase leading-none">Novo</span>
            <span className="rounded-[5px] bg-brand-yellow px-2 py-0.5 font-display text-xs font-bold uppercase tracking-[0.12em] text-ink">
              Taller
            </span>
          </div>

          {/* Gafete */}
          <section className="mt-7 overflow-hidden rounded-[20px] bg-[#232220]">
            <div className="bg-brand-yellow px-6 pb-5 pt-6 text-ink sm:px-8">
              <p className="font-display text-sm font-bold uppercase tracking-[0.18em]">Gafete de equipo</p>
              <h1 className="mt-1.5 font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-5xl">
                Bienvenido al taller
              </h1>
            </div>
            <div className="relative" aria-hidden="true">
              <span className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-[#141413]" />
              <span className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-[#141413]" />
            </div>

            <div className="px-6 pb-8 pt-6 sm:px-8">
              {email || role ? (
                <>
                  <dl className="flex flex-wrap gap-x-8 gap-y-4">
                    {email ? (
                      <div className="min-w-0">
                        <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Correo</dt>
                        <dd className="mt-1 break-all text-[17px] font-semibold">{email}</dd>
                      </div>
                    ) : null}
                    {role ? (
                      <div>
                        <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Rol</dt>
                        <dd className="mt-1 text-[17px] font-semibold">{roleLabels[role] ?? role}</dd>
                      </div>
                    ) : null}
                  </dl>
                  <div className="mt-5 border-t-2 border-dashed border-[#3d3b36]" />
                </>
              ) : null}

              <p className="mt-5 text-base text-[#d9d5cc]">Crea tu contraseña para entrar al panel.</p>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
                {error ? (
                  <div role="alert" className="rounded-[10px] border-[1.5px] border-brand-red-dark bg-brand-red/10 px-4 py-3 text-[15px] text-[#ffb4b4]">
                    {error}
                  </div>
                ) : null}

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-[15px] font-semibold text-[#e6e3dc]">
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={fieldClassName}
                    disabled={isSaving}
                  />
                  <div className="mt-2 flex gap-1" aria-hidden="true">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className={`h-[5px] flex-1 rounded-full ${strength >= n ? "bg-brand-yellow" : "bg-[#3a3936]"}`} />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[13px] text-on-ink-muted">
                    {password.length === 0
                      ? "Mínimo 8 caracteres"
                      : password.length < 8
                        ? `Te faltan ${8 - password.length} caracteres`
                        : strength >= 3
                          ? "Segura"
                          : "Sirve; con números y mayúsculas queda más segura"}
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-[15px] font-semibold text-[#e6e3dc]">
                    Confírmala
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={fieldClassName}
                    disabled={isSaving}
                  />
                  {confirmPassword.length > 0 ? (
                    <p className={`mt-1.5 text-[13px] font-semibold ${matches ? "text-brand-yellow" : "text-[#ffb4b4]"}`}>
                      {matches ? "✓ Coinciden" : "No coinciden todavía"}
                    </p>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="!mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-brand-yellow px-6 text-[17px] font-bold text-ink transition hover:bg-[#e8b90f] disabled:opacity-60"
                >
                  {isSaving ? "Guardando…" : "Crear contraseña y entrar"}
                </button>
              </form>
            </div>
          </section>

          <p className="mt-5 text-center text-sm text-on-ink-muted">
            ¿No esperabas esta invitación? Ignora el correo; sin contraseña no se activa la cuenta.
          </p>
        </div>
      </main>
    </div>
  );
}
