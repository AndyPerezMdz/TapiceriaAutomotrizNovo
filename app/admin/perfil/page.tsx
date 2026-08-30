import { ChangePasswordForm } from "@/components/portal/ChangePasswordForm";
import { StaffAvatarUploader } from "@/components/admin/StaffAvatarUploader";
import { StaffProfileForm } from "@/components/admin/StaffProfileForm";
import { createClient } from "@/lib/supabase/server";
import { ChangeEmailForm } from "@/components/shared/ChangeEmailForm";

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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Mi perfil
      </h1>

      <div className="mb-8 rounded-lg border border-black/10 bg-surface p-6 dark:border-white/10">
        <StaffAvatarUploader
          currentAvatarUrl={profile?.avatar_url ?? null}
          fullName={profile?.full_name ?? ""}
          role={profile?.role ?? ""}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-black/10 bg-surface p-6 dark:border-white/10">
          <h2 className="mb-4 text-sm font-semibold text-foreground">
            Información personal
          </h2>
          <StaffProfileForm
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
      </div>
    </div>
  );
}