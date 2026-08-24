import { ChangePasswordForm } from "@/components/portal/ChangePasswordForm";
import { ProfileForm } from "@/components/portal/ProfileForm";
import { createClient } from "@/lib/supabase/server";

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, phone, email")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        Mi perfil
      </h1>

      <div className="mb-10">
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Información personal
        </h2>
        <ProfileForm
          email={profile?.email ?? user?.email ?? ""}
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? null}
        />
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          Contraseña
        </h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}