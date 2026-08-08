import { BrandLogo } from "@/components/auth/BrandLogo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import { History, LayoutDashboard, PlusCircle } from "lucide-react";
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
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
    : { data: null };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="border-b border-black/10 bg-surface dark:border-white/10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link href="/portal">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted sm:inline">
              {profile?.full_name}
            </span>
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
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}