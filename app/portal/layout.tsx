import { ChatWidget } from "@/components/chat/ChatWidget";
import { ApplyPendingReferral } from "@/components/portal/ApplyPendingReferral";
import { BottomNav } from "@/components/portal/BottomNav";
import { NotificationBell } from "@/components/portal/NotificationBell";
import { PortalSidebar } from "@/components/portal/PortalSidebar";
import { UserMenu } from "@/components/shared/UserMenu";
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
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 pt-3 sm:px-8 sm:pt-4 lg:justify-end">
            <Link href="/portal" className="lg:hidden">
              <FooterLogo />
            </Link>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <ChatWidget variant="header" />
              <NotificationBell notifications={notifications} />
              <span className="mx-1 hidden h-7 border-l-2 border-dashed border-seam sm:block" aria-hidden="true" />
              <UserMenu
                name={profile?.full_name ?? null}
                subtitle="Cliente"
                avatarUrl={profile?.avatar_url ?? null}
                profileHref="/portal/perfil"
              />
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