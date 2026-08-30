"use client";

import { MessageSquare, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatWidget() {
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: newMessages.slice(0, -1),
        }),
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
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lo siento, tuve un problema de conexión." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {isOpen ? (
        <div className="fixed bottom-24 left-5 z-50 flex h-[480px] w-[340px] flex-col overflow-hidden rounded-lg border border-black/10 bg-surface shadow-2xl dark:border-white/10 sm:w-96">
          <div className="flex items-center justify-between bg-brand-black px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Novi</p>
              <p className="text-xs text-white/60">Asistente de Tapicería NOVO</p>
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
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
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
              <div className="flex justify-start">
                <div className="rounded-lg bg-black/5 px-3 py-2 text-sm text-muted dark:bg-white/10">
                  Escribiendo...
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
        </div>
      ) : null}

      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Abrir chat"
        className="fixed bottom-5 left-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-black text-white shadow-lg transition hover:scale-105 hover:shadow-xl dark:bg-white dark:text-brand-black"
      >
        <MessageSquare size={24} />
      </button>
    </>
  );
}