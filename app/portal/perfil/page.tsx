import { AvatarUploader } from "@/components/portal/AvatarUploader";
import { ChangePasswordForm } from "@/components/portal/ChangePasswordForm";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import { Bell, BookOpen, KeyRound, UserRound } from "lucide-react";
import Link from "next/link";
import { ChangeEmailForm } from "@/components/shared/ChangeEmailForm";
import { DownloadManualCard } from "@/components/shared/DownloadManualCard";
import { MarketingOptInToggle } from "@/components/portal/MarketingOptInToggle";
import { PushNotificationToggle } from "@/components/portal/PushNotificationToggle";

const tabs = [
  { value: "datos", label: "Mis datos", icon: UserRound },
  { value: "seguridad", label: "Correo y contraseña", icon: KeyRound },
  { value: "avisos", label: "Notificaciones", icon: Bell },
  { value: "ayuda", label: "Ayuda", icon: BookOpen },
] as const;

type Tab = (typeof tabs)[number]["value"];

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function PerfilPage({ searchParams }: Props) {
  const { tab: tabParam } = await searchParams;
  const tab: Tab = (tabs.find((t) => t.value === tabParam)?.value ?? "datos") as Tab;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: totalOrders }, { count: activeOrders }, { data: reviews }] =
    await Promise.all([
      user
        ? supabase
            .from("profiles")
            .select("full_name, phone, email, avatar_url, created_at, marketing_opt_in")
            .eq("id", user.id)
            .single()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("client_id", user.id)
            .is("deleted_at", null)
        : Promise.resolve({ count: 0 }),
      user
        ? supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("client_id", user.id)
            .is("deleted_at", null)
            .not("status", "in", "(entregado,cancelado,rechazado)")
        : Promise.resolve({ count: 0 }),
      user
        ? supabase.from("reviews").select("rating").eq("client_id", user.id)
        : Promise.resolve({ data: [] }),
    ]);

  const avgRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      })
    : null;

  const card = "rounded-[18px] bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5";
  const h2 = "mb-5 font-display text-[28px] font-bold uppercase leading-none text-foreground";

  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-6xl">
        Mi perfil
      </h1>

      {/* Tarjeta de cliente */}
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-[20px] bg-ink px-5 py-6 text-on-ink sm:px-8 dark:ring-1 dark:ring-white/10">
        <div className="flex items-center gap-5 [&_p]:text-on-ink">
          <AvatarUploader currentAvatarUrl={profile?.avatar_url ?? null} fullName={profile?.full_name ?? ""} />
        </div>
        <dl className="flex flex-wrap gap-x-8 gap-y-3">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Pedidos</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold leading-none">{totalOrders ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Activos</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold leading-none text-brand-yellow">{activeOrders ?? 0}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Tus reseñas</dt>
            <dd className="mt-1 font-display text-3xl font-extrabold leading-none">{avgRating ? `${avgRating} ★` : "—"}</dd>
          </div>
          {memberSince ? (
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-on-ink-muted">Cliente desde</dt>
              <dd className="mt-1.5 text-base font-semibold capitalize">{memberSince}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="flex flex-wrap items-start gap-6">
        {/* Secciones */}
        <nav aria-label="Secciones del perfil" className="w-full min-w-0 lg:sticky lg:top-6 lg:w-60 lg:shrink-0">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            {tabs.map((t) => {
              const active = t.value === tab;
              return (
                <li key={t.value} className="shrink-0">
                  <Link
                    href={`/portal/perfil?tab=${t.value}`}
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

        {/* Contenido */}
        <div className="min-w-0 flex-1 space-y-6">
          {tab === "datos" ? (
            <section className={card}>
              <h2 className={h2}>Mis datos</h2>
              <ProfileForm
                email={profile?.email ?? user?.email ?? ""}
                fullName={profile?.full_name ?? ""}
                phone={profile?.phone ?? null}
              />
            </section>
          ) : null}

          {tab === "seguridad" ? (
            <>
              <section className={card}>
                <h2 className={h2}>Correo electrónico</h2>
                <ChangeEmailForm currentEmail={profile?.email ?? user?.email ?? ""} />
              </section>
              <section className={card}>
                <h2 className={h2}>Contraseña</h2>
                <ChangePasswordForm />
              </section>
            </>
          ) : null}

          {tab === "avisos" ? (
            <section className={`${card} space-y-6`}>
              <h2 className={`${h2} !mb-0`}>Notificaciones</h2>
              <PushNotificationToggle />
              <div className="border-t-2 border-dashed border-seam" />
              <MarketingOptInToggle initialValue={profile?.marketing_opt_in ?? false} />
            </section>
          ) : null}

          {tab === "ayuda" ? (
            <section className={card}>
              <h2 className={h2}>Ayuda</h2>
              <DownloadManualCard
                title="Manual del cliente"
                description="Guía de uso del portal en PDF"
                fileUrl="https://uselstfcbygkzohamzhd.supabase.co/storage/v1/object/public/manuales/Manual_Cliente.pdf"
              />
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
