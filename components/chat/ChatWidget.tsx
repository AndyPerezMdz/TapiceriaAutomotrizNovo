"use client";

import { NoviAvatar } from "@/components/chat/NoviAvatar";
import { Sparkles } from "lucide-react";
import Link from "next/link";

interface Props {
  variant?: "header" | "floating";
}

export function ChatWidget({ variant = "floating" }: Props) {
  if (variant === "header") {
    return (
      <Link
        href="/chat"
        aria-label="Hablar con Novi, asistente de IA"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
      >
        <NoviAvatar size={26} />
      </Link>
    );
  }

  // variant "floating" (solo sitio público)
  return (
    <Link
      href="/chat"
      aria-label="Hablar con Novi, asistente de IA"
      className="fixed bottom-5 left-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105"
      style={{
        animation: "novi-bounce 3s ease-in-out infinite, novi-pulse-ring 2.5s ease-out infinite",
      }}
    >
      <NoviAvatar size={40} />
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-white shadow">
        <Sparkles size={11} />
      </span>
    </Link>
  );
}