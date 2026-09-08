"use client";
import { createClient } from "@/lib/supabase/client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  variant?: "full" | "icon";
}

export function SignOutButton({ variant = "full" }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    setIsLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleSignOut}
        disabled={isLoading}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        className="flex h-8 w-8 items-center justify-center rounded-md border border-black/15 text-foreground transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
      >
        <LogOut size={15} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className="flex items-center gap-1.5 rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:hover:bg-white/5"
    >
      <LogOut size={14} />
      {isLoading ? "Cerrando sesión..." : "Cerrar sesión"}
    </button>
  );
}