import { ChangePasswordForm } from "@/components/portal/ChangePasswordForm";
import { StaffAvatarUploader } from "@/components/admin/StaffAvatarUploader";
import { StaffProfileForm } from "@/components/admin/StaffProfileForm";
import { DownloadManualCard } from "@/components/shared/DownloadManualCard";
import { createClient } from "@/lib/supabase/server";
import { BookOpen, KeyRound, UserRound } from "lucide-react";
import Link from "next/link";

const MANUALES = "https://uselstfcbygkzohamzhd.supabase.co/storage/v1/object/public/manuales";

const tabs = [
  { value: "datos", label: "Mis datos", icon: UserRound },
  { value: "seguridad", label: "Contraseña", icon: KeyRound },
  { value: "ayuda", label: "Manuales", icon: BookOpen },
] as const;

type Tab = (typeof tabs)[number]["value"];

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  empleado: "Empleado",
  staff: "Staff",
};

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function StaffPerfilPage({ searchParams }: Props) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = (tabs.find((t) => t.value === tabParam)?.value ?? "datos") as Tab;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, phone, email, avatar_url, role, created_at")
        .eq("id", user.id)
        .single()
    : { data: null };

  const role = profile?.role ?? "";
  const isAdmin = role === "admin";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-MX", { month: "long", year: "numeric" })
    : null;

  const card = "rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5";
  const h2 = "mb-5 font-display text-[28px] font-bold uppercase leading-none text-foreground";

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-6xl">
        Mi perfil
      </h1>

      {/* Gafete */}
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] bg-ink px-5 py-6 text-on-ink sm:px-8 dark:ring-1 dark:ring-white/10">
        <div className="[&_p]:text-on-ink">
          <StaffAvatarUploader
            currentAvatarUrl={profile?.avatar_url ?? null}
            fullName={profile?.full_name ?? ""}
            role={roleLabels[role] ?? role}
          />
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Rol</dt>
            <dd className="mt-1.5">
              <span className="inline-block -rotate-3 rounded-md border-2 border-brand-yellow px-2.5 py-0.5 font-display text-lg font-extrabold uppercase tracking-wide text-brand-yellow">
                {roleLabels[role] ?? (role || "—")}
              </span>
            </dd>
          </div>
          {memberSince ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">En el taller desde</dt>
              <dd className="mt-1.5 text-base font-semibold capitalize">{memberSince}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        <nav aria-label="Secciones del perfil" className="w-full min-w-0 lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {tabs.map((t) => {
              const active = t.value === tab;
              return (
                <li key={t.value} className="shrink-0">
                  <Link
                    href={`/admin/perfil?tab=${t.value}`}
                    scroll={false}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center gap-3 whitespace-nowrap rounded-xl px-4 text-[15px] transition ${
                      active
                        ? "bg-ink font-semibold text-brand-yellow dark:ring-1 dark:ring-white/10"
                        : "bg-surface text-foreground hover:ring-1 hover:ring-foreground/30 dark:ring-1 dark:ring-white/5"
                    }`}
                  >
                    <t.icon size={18} className="shrink-0" />
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {tab === "datos" ? (
            <section className={card}>
              <h2 className={h2}>Mis datos</h2>
              <StaffProfileForm
                email={profile?.email ?? user?.email ?? ""}
                fullName={profile?.full_name ?? ""}
                phone={profile?.phone ?? null}
              />
            </section>
          ) : null}

          {tab === "seguridad" ? (
            <section className={card}>
              <h2 className={h2}>Contraseña</h2>
              <ChangePasswordForm />
            </section>
          ) : null}

          {tab === "ayuda" ? (
            <section className={`${card} space-y-4`}>
              <h2 className={h2}>Manuales</h2>
              <DownloadManualCard
                title={isAdmin ? "Manual de Staff" : "Manual del Empleado"}
                description="Guía de uso del panel del taller en PDF"
                fileUrl={`${MANUALES}/${isAdmin ? "Manual_Staff.pdf" : "Manual_Empleado.pdf"}`}
              />
              {isAdmin ? (
                <DownloadManualCard
                  title="Documentación técnica"
                  description="Arquitectura, base de datos y despliegue del sistema"
                  fileUrl={`${MANUALES}/Documentacion_Tecnica.pdf`}
                />
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
