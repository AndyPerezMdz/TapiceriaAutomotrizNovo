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
        className="flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] border-field-border bg-surface py-1 pl-1 pr-3 text-[15px] font-semibold text-foreground transition hover:border-foreground"
      >
        <NoviAvatar size={32} />
        <span className="hidden sm:inline">Novi</span>
        <Sparkles size={14} className="hidden text-yellow-text sm:inline" aria-hidden="true" />
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