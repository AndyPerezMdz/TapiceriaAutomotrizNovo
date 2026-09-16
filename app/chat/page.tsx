"use client";

import { ChatCore } from "@/components/chat/ChatCore";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <button
        onClick={() => router.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft size={16} /> Volver
      </button>
      <ChatCore />
    </div>
  );
}