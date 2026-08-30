import { FooterLogo } from "@/components/FooterLogo";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Settings, Tag } from "lucide-react";
import {
  BarChart3,
  ClipboardList,
  History,
  ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Star,
  User,
  Users,
  Users2,
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
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="border-b border-black/10 bg-surface dark:border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/admin">
            <FooterLogo />
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/admin/perfil" className="hidden items-center gap-2 sm:flex">
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
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs capitalize text-muted">{profile?.role}</p>
              </div>
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/admin"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <LayoutDashboard size={16} /> Dashboard
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/reportes"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
            >
              <BarChart3 size={16} /> Reportes
            </Link>
          ) : null}
          <Link
            href="/admin/pedidos"
            className="relative flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <ClipboardList size={16} /> Pedidos
            {pendingCount && pendingCount > 0 ? (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
                {pendingCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/admin/clientes"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <Users2 size={16} /> Clientes
          </Link>
          <Link
            href="/admin/citas"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <Calendar size={16} /> Citas
          </Link>
          <Link
            href="/admin/contactos"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <MessageSquare size={16} /> Contactos
          </Link>
          <Link
            href="/admin/servicios"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <Wrench size={16} /> Servicios
          </Link>
          <Link
            href="/admin/galeria"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <ImageIcon size={16} /> Galería
          </Link>
          <Link
            href="/admin/resenas"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <Star size={16} /> Reseñas
          </Link>
          <Link
            href="/admin/historial"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <History size={16} /> Historial
          </Link>
          {isAdmin ? (
            <Link
              href="/admin/usuarios"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
            >
              <Users size={16} /> Usuarios
            </Link>
          ) : null}
          {isAdmin ? (
          <Link
            href="/admin/configuracion"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <Settings size={16} /> Configuración
          </Link>
          ) : null}
          
          {isAdmin ? (
            <Link
              href="/admin/cupones"
              className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
            >
              <Tag size={16} /> Cupones
            </Link>
          ) : null}
  
          <Link
            href="/admin/perfil"
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition hover:border-brand-yellow hover:text-foreground"
          >
            <User size={16} /> Mi perfil
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}