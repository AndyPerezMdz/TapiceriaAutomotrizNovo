import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { UserMenu } from "@/components/shared/UserMenu";
import { A11ySync } from "@/components/a11y/A11ySync";
import { prefsFromProfile } from "@/lib/a11y/preferences";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("full_name, role, avatar_url, ui_mode, text_size, high_contrast, reduce_motion")
        .eq("id", user.id)
        .single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  const [{ count: pendingCount }, { count: complaintsCount }] = await Promise.all([
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .in("status", ["pendiente_revision", "cotizado"])
      .is("deleted_at", null),
    supabase
      .from("complaints")
      .select("*", { count: "exact", head: true })
      .eq("status", "abierta"),
  ]);

  return (
    <div className="theme-taller flex min-h-screen bg-background text-foreground">
      <AdminSidebar
        isAdmin={isAdmin}
        pendingCount={pendingCount ?? 0}
        complaintsCount={complaintsCount ?? 0}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-1.5 px-4 pb-1 pl-16 pt-3 sm:gap-2 lg:px-10 lg:pl-10 lg:pt-4">
          <ChatWidget variant="header" />
          <span className="mx-1 hidden h-7 border-l-2 border-dashed border-seam sm:block" aria-hidden="true" />
          <UserMenu
            name={profile?.full_name ?? null}
            subtitle={profile?.role === "admin" ? "Administrador" : profile?.role ?? "Staff"}
            avatarUrl={profile?.avatar_url ?? null}
            profileHref="/admin/perfil"
          />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-4 sm:px-8 lg:px-10">{children}</main>
      </div>
      {user ? <A11ySync prefs={prefsFromProfile(profile)} /> : null}
    </div>
  );
}