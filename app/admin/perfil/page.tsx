import { ChangePasswordForm } from "@/components/portal/ChangePasswordForm";
import { StaffAvatarUploader } from "@/components/admin/StaffAvatarUploader";
import { StaffProfileForm } from "@/components/admin/StaffProfileForm";
import { DownloadManualCard } from "@/components/shared/DownloadManualCard";
import { createClient } from "@/lib/supabase/server";

export default async function StaffPerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, phone, email, avatar_url, role")
        .eq("id", user.id)
        .single()
    : { data: null };

  const isAdmin = profile?.role === "admin";

  const manualUrl = isAdmin
    ? "https://uselstfcbygkzohamzhd.supabase.co/storage/v1/object/public/manuales/Manual_Staff.pdf"
    : "https://uselstfcbygkzohamzhd.supabase.co/storage/v1/object/public/manuales/Manual_Empleado.pdf";

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95] sm:text-6xl mb-8 text-foreground">
        Mi perfil
      </h1>

      <div className="mb-8 rounded-2xl bg-surface p-6 dark:ring-1 dark:ring-white/5">
        <StaffAvatarUploader
          currentAvatarUrl={profile?.avatar_url ?? null}
          fullName={profile?.full_name ?? ""}
          role={profile?.role ?? ""}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl bg-surface p-6 dark:ring-1 dark:ring-white/5">
          <h2 className="font-display text-2xl font-bold uppercase mb-4 text-foreground">
            Información personal
          </h2>
          <StaffProfileForm
            email={profile?.email ?? user?.email ?? ""}
            fullName={profile?.full_name ?? ""}
            phone={profile?.phone ?? null}
          />
        </div>

        <div className="rounded-2xl bg-surface p-6 dark:ring-1 dark:ring-white/5">
          <h2 className="font-display text-2xl font-bold uppercase mb-4 text-foreground">
            Contraseña
          </h2>
          <ChangePasswordForm />
        </div>
      </div>

      <div className="mt-6">
        <DownloadManualCard
          title={isAdmin ? "Manual de Staff" : "Manual del Empleado"}
          description="Guía de uso del panel administrativo en PDF"
          fileUrl={manualUrl}
        />
      </div>
    </div>
  );
}