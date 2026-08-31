import { AvatarUploader } from "@/components/portal/AvatarUploader";
import { ChangePasswordForm } from "@/components/portal/ChangePasswordForm";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { createClient } from "@/lib/supabase/server";
import { Calendar, ClipboardList, Star } from "lucide-react";
import { ChangeEmailForm } from "@/components/shared/ChangeEmailForm";
import { DownloadManualCard } from "@/components/shared/DownloadManualCard";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { count: totalOrders }, { count: activeOrders }, { data: reviews }] =
    await Promise.all([
      user
        ? supabase
            .from("profiles")
            .select("full_name, phone, email, avatar_url, created_at")
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

  return (
    <div className="mx-auto max-w-3xl">
      {/* Hero */}
      <div className="mb-8 rounded-lg border border-black/10 bg-surface p-6 dark:border-white/10">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <AvatarUploader
            currentAvatarUrl={profile?.avatar_url ?? null}
            fullName={profile?.full_name ?? ""}
          />
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 border-t border-black/10 pt-6 dark:border-white/10">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted">
              <ClipboardList size={14} />
              <span className="text-xs">Pedidos totales</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{totalOrders ?? 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted">
              <ClipboardList size={14} />
              <span className="text-xs">Activos</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">{activeOrders ?? 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-muted">
              <Star size={14} />
              <span className="text-xs">Tu calificación prom.</span>
            </div>
            <p className="mt-1 text-xl font-bold text-foreground">
              {avgRating ?? "—"}
            </p>
          </div>
        </div>

        {memberSince ? (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted">
            <Calendar size={12} /> Cliente desde {memberSince}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-surface p-6 dark:border-white/10">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Información personal
          </h2>
          <ProfileForm
            email={profile?.email ?? user?.email ?? ""}
            fullName={profile?.full_name ?? ""}
            phone={profile?.phone ?? null}
          />
        </div>

        <div className="mt-6 border-t border-black/10 pt-6 dark:border-white/10">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Correo electrónico</h3>
          <ChangeEmailForm currentEmail={profile?.email ?? user?.email ?? ""} />
        </div>

        <div className="rounded-lg border border-black/10 bg-surface p-6 dark:border-white/10">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Contraseña
          </h2>
          <ChangePasswordForm />
        </div>
        <div className="mt-6">
          <DownloadManualCard
            title="Manual del cliente"
            description="Guía de uso del portal en PDF"
            fileUrl="https://uselstfcbygkzohamzhd.supabase.co/storage/v1/object/public/manuales/Manual_Cliente.pdf"
          />
        </div>
      </div>
    </div>

  );
}