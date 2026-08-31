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
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      <PortalSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-black/10 bg-surface dark:border-white/10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3 lg:justify-end">
            <Link href="/portal" className="lg:hidden">
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
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 pb-24 lg:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
      <ChatWidget />
      <ApplyPendingReferral />
    </div>
  );
}