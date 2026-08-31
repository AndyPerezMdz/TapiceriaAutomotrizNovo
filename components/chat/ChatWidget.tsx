"use client";

import { NoviAvatar } from "@/components/chat/NoviAvatar";
import { MessageSquareText, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  variant?: "header" | "floating";
}

export function ChatWidget({ variant = "floating" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "¡Hola! Soy Novi, el asistente de Tapicería Automotriz by NOVO. ¿En qué puedo ayudarte?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen, showSlowNotice]);

  useEffect(() => {
    if (variant !== "header") return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [variant]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setShowSlowNotice(false);

    const controller = new AbortController();
    const abortTimer = setTimeout(() => controller.abort(), 30000);
    slowTimerRef.current = setTimeout(() => setShowSlowNotice(true), 6000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: newMessages.slice(0, -1),
        }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Lo siento, tuve un problema. Intenta de nuevo." },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: isTimeout
            ? "Tardé demasiado en responder. Intenta de nuevo en un momento."
            : "Lo siento, tuve un problema de conexión.",
        },
      ]);
    } finally {
      clearTimeout(abortTimer);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setShowSlowNotice(false);
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const chatBody = (
    <>
      <div className="flex items-center justify-between bg-brand-black px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-full bg-white/95 p-0.5">
            <NoviAvatar size={28} />
          </div>
          <div>
            <p className="flex items-center gap-1 text-sm font-semibold text-white">
              Novi
              <Sparkles size={12} className="text-brand-yellow" />
            </p>
            <p className="text-xs text-white/60">Asistente con IA</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/70 transition hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" ? (
              <NoviAvatar size={22} className="mb-1 shrink-0" />
            ) : null}
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user"
                  ? "bg-brand-yellow text-brand-black"
                  : "bg-black/5 text-foreground dark:bg-white/10"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isLoading ? (
          <div className="flex items-end gap-2">
            <NoviAvatar size={22} className="mb-1 shrink-0" />
            <div className="max-w-[80%] rounded-lg bg-black/5 px-3 py-2.5 dark:bg-white/10">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
              </div>
              {showSlowNotice ? (
                <p className="mt-1.5 text-[11px] text-muted">
                  A veces tardo un poco más de lo normal — sigo aquí.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-end gap-2 border-t border-black/10 p-3 dark:border-white/10">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta..."
          rows={1}
          disabled={isLoading}
          className="max-h-24 flex-1 resize-none rounded-md border border-black/15 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black disabled:opacity-60 dark:border-white/15"
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-black text-white transition hover:bg-brand-black/85 disabled:opacity-50 dark:bg-white dark:text-brand-black"
        >
          <Send size={16} />
        </button>
      </div>
    </>
  );

  if (variant === "header") {
    return (
      <div className="relative" ref={wrapperRef}>
        <button
          onClick={() => setIsOpen((v) => !v)}
          aria-label="Abrir chat con Novi, asistente de IA"
          className="relative flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
        >
          <MessageSquareText size={18} />
        </button>

        {isOpen ? (
          <div className="fixed inset-x-4 top-16 z-50 flex h-[70vh] flex-col overflow-hidden rounded-lg border border-black/10 bg-surface shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:h-[480px] sm:w-96 dark:border-white/10">
            {chatBody}
          </div>
        ) : null}
      </div>
    );
  }

  // variant "floating" (solo sitio público)
  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-24 left-5 z-50 flex h-[480px] w-[320px] flex-col overflow-hidden rounded-lg border border-black/10 bg-surface shadow-2xl sm:w-96 dark:border-white/10">
          {chatBody}
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Abrir chat con Novi, asistente de IA"
        className="fixed bottom-5 left-5 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg transition hover:scale-105"
        style={{
          animation: isOpen
            ? undefined
            : "novi-bounce 3s ease-in-out infinite, novi-pulse-ring 2.5s ease-out infinite",
        }}
      >
        <NoviAvatar size={40} />
        {!isOpen ? (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-red text-white shadow">
            <Sparkles size={11} />
          </span>
        ) : null}
      </button>
    </>
  );
}