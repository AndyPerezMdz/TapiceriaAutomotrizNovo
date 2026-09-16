"use client";

import { BrandLogo } from "@/components/auth/BrandLogo";
import { ChatCore } from "@/components/chat/ChatCore";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function ChatPage() {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsEntering(false), 900);
    return () => clearTimeout(timer);
  }, []);

  if (isEntering) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-black">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-white/10 border-t-brand-yellow" />
          <div className="animate-novi-sway">
            <Image
              src="/images/novi-avatar.png"
              alt="Novi"
              width={64}
              height={64}
              className="rounded-full"
              priority
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="relative mx-auto max-w-5xl px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <ChatCore />
      </div>
    </div>
  );
}