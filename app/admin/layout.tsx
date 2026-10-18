import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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
        .select("full_name, role, avatar_url")
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
        <header className="flex items-center justify-between gap-2 px-4 pb-1 pt-3 pl-16 sm:gap-3 lg:justify-end lg:px-10 lg:pl-10 lg:pt-4">
          <div className="w-64 lg:hidden" />

          {/* Celular: solo lo esencial */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <ChatWidget variant="header" />
            <Link
              href="/admin/perfil"
              aria-label="Mi perfil"
              className="flex h-8 w-8 items-center justify-center rounded-full"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-base font-bold text-brand-yellow">
                  {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
            </Link>
            <SignOutButton variant="icon" />
          </div>

          {/* Escritorio: todo visible */}
          <div className="hidden items-center gap-3 sm:flex">
            <ChatWidget variant="header" />
            <Link href="/admin/perfil" className="flex items-center gap-2">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-base font-bold text-brand-yellow">
                  {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
              )}
              <div className="hidden text-right sm:block">
                <p className="text-[15px] font-semibold text-foreground">{profile?.full_name}</p>
                <p className="text-[13px] capitalize text-muted">{profile?.role}</p>
              </div>
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-4 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}