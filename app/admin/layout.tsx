import { BrandLogo } from "@/components/auth/BrandLogo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import {
  ClipboardList,
  ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Users,
  Wrench,
} from "lucide-react";
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
        .select("full_name, role")
        .eq("id", user.id)
        .single()
    : { data: null };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="border-b border-black/10 bg-brand-black dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/admin">
            <BrandLogo />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-white">{profile?.full_name}</p>
              <p className="text-xs capitalize text-white/50">{profile?.role}</p>
            </div>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/60 transition hover:border-brand-yellow hover:text-white"
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          <Link
            href="/admin/pedidos"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/60 transition hover:border-brand-yellow hover:text-white"
          >
            <ClipboardList size={16} /> Pedidos
          </Link>
          <Link
            href="/admin/contactos"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/60 transition hover:border-brand-yellow hover:text-white"
          >
            <MessageSquare size={16} /> Contactos
          </Link>
          <Link
            href="/admin/servicios"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/60 transition hover:border-brand-yellow hover:text-white"
          >
            <Wrench size={16} /> Servicios
          </Link>
          <Link
            href="/admin/galeria"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/60 transition hover:border-brand-yellow hover:text-white"
          >
            <ImageIcon size={16} /> Galería
          </Link>
          {profile?.role === "admin" ? (
            <Link
              href="/admin/usuarios"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-white/60 transition hover:border-brand-yellow hover:text-white"
            >
              <Users size={16} /> Usuarios
            </Link>
          ) : null}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}