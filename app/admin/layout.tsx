import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatWidget } from "@/components/chat/ChatWidget";
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

  const { count: pendingCount } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .in("status", ["pendiente_revision", "cotizado"])
    .is("deleted_at", null);

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar isAdmin={isAdmin} pendingCount={pendingCount ?? 0} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-black/10 bg-surface px-4 py-3 pl-16 dark:border-white/10 lg:px-6 lg:pl-6">
          <ChatWidget variant="header" />
          <Link href="/admin/perfil" className="flex items-center gap-2">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-yellow/20 text-xs font-semibold text-brand-yellow-dark dark:text-brand-yellow">
                {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
            )}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
              <p className="text-xs capitalize text-muted">{profile?.role}</p>
            </div>
          </Link>
          <ThemeToggle />
          <SignOutButton />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">{children}</main>
      </div>
    </div>
  );
}