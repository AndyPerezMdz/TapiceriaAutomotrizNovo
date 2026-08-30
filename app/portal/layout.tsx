import { FooterLogo } from "@/components/FooterLogo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { NotificationBell } from "@/components/portal/NotificationBell";
import { getPortalNotifications } from "@/lib/notifications/get-portal-notifications";
import { createClient } from "@/lib/supabase/server";
import { CalendarDays, History, LayoutDashboard, PlusCircle, User } from "lucide-react";
import Link from "next/link";

export default async function PortalLayout({
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
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .single()
    : { data: null };

  const notifications = user ? await getPortalNotifications(supabase, user.id) : [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="border-b border-black/10 bg-surface dark:border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/portal">
            <FooterLogo />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/portal/perfil"
              className="hidden items-center gap-2 sm:flex"
            >
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
              <span className="text-sm text-muted">{profile?.full_name}</span>
            </Link>
            <NotificationBell notifications={notifications} />
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>

        <nav className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/portal"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <LayoutDashboard size={16} /> Mis pedidos
          </Link>
          <Link
            href="/portal/pedidos"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <History size={16} /> Historial
          </Link>
          <Link
            href="/portal/nuevo-pedido"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <PlusCircle size={16} /> Nuevo pedido
          </Link>
          <Link
            href="/portal/mis-citas"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <CalendarDays size={16} /> Mis citas
          </Link>
          <Link
            href="/portal/perfil"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <User size={16} /> Mi perfil
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>

      <ChatWidget />
    </div>
  );
}