"use client";

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
      <div className="flex min-h-screen items-center justify-center bg-ink">
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
    <div className="theme-taller min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-3 pb-4 pt-3 sm:px-6 sm:pt-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-2 inline-flex min-h-11 items-center gap-2 text-[15px] font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <ChatCore />
      </div>
    </div>
  );
}
