import { StorageImage } from "@/components/shared/StorageImage";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { ApplyPendingReferral } from "@/components/portal/ApplyPendingReferral";
import { BottomNav } from "@/components/portal/BottomNav";
import { NotificationBell } from "@/components/portal/NotificationBell";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { getPortalNotifications } from "@/lib/notifications/get-portal-notifications";
import { createClient } from "@/lib/supabase/server";
import { FooterLogo } from "@/components/FooterLogo";
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
    <div className="theme-taller flex min-h-screen overflow-x-hidden bg-background text-foreground">
      <PortalSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-4 sm:px-8 lg:justify-end">
            <Link href="/portal" className="lg:hidden">
              <FooterLogo />
            </Link>

            {/* Celular: solo lo esencial */}
            <div className="flex items-center gap-1 sm:hidden">
              <ChatWidget variant="header" />
              <NotificationBell notifications={notifications} />
            </div>

            {/* Escritorio: todo visible */}
            <div className="hidden items-center gap-3 sm:flex">
              <Link href="/portal/perfil" className="flex items-center gap-2">
                {profile?.avatar_url ? (
                  <StorageImage src={profile.avatar_url} alt="" width={36} height={36} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ink font-display text-base font-bold text-brand-yellow">
                    {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-[15px] font-medium text-foreground">{profile?.full_name}</span>
              </Link>
              <ChatWidget variant="header" />
              <NotificationBell notifications={notifications} />
              <ThemeToggle />
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-4 sm:px-8 sm:pt-6 lg:pb-16">
          {children}
        </main>
      </div>
      <BottomNav />
      <ApplyPendingReferral />
    </div>
  );
}