"use client";

import { NoviAvatar } from "@/components/chat/NoviAvatar";
import { History, Plus, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface Props {
  variant?: "header" | "floating";
}

const STORAGE_KEY = "novi_conversations";
const MAX_STORED_CONVERSATIONS = 20;

const cuteWaitingMessages = [
  "Ten paciencia, es su primer día...",
  "Eres su primer cliente, dale chance...",
  "Apenas está entablando conversación contigo...",
  "Está pensando muy bien su respuesta...",
  "Todavía se está acostumbrando a esto...",
  "Su CV dice que es tímido...",
  "Está buscando la respuesta en su memoria RAM...",
  "Está consultando con sus compañeros de IA...",
  "Está buscando en Google...",
  "Está recordando lo que aprendió en la universidad...",
  "Está buscando en su base de datos de conocimientos...",
];

const defaultGreeting: ChatMessage = {
  role: "assistant",
  content:
    "¡Hola! Soy Novi, el asistente de Tapicería Automotriz by NOVO. ¿En qué puedo ayudarte?",
};

function makeNewConversation(): Conversation {
  return {
    id: crypto.randomUUID(),
    title: "Nueva conversación",
    messages: [defaultGreeting],
    updatedAt: Date.now(),
  };
}

function loadConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  try {
    const trimmed = conversations
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, MAX_STORED_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // No es crítico si el navegador bloquea localStorage.
  }
}

function relativeDate(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Ahora";
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} días`;
  return new Date(timestamp).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export function ChatWidget({ variant = "floating" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([defaultGreeting]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState(cuteWaitingMessages[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Al montar: carga conversaciones guardadas, o crea la primera.
  useEffect(() => {
    const loaded = loadConversations();
    if (loaded.length > 0) {
      const mostRecent = [...loaded].sort((a, b) => b.updatedAt - a.updatedAt)[0];
      setConversations(loaded);
      setActiveId(mostRecent.id);
      setMessages(mostRecent.messages);
    } else {
      const fresh = makeNewConversation();
      setConversations([fresh]);
      setActiveId(fresh.id);
      setMessages(fresh.messages);
    }
  }, []);

  // Cada vez que cambian los mensajes, actualiza la conversación activa y guarda.
  useEffect(() => {
    if (!activeId) return;
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id !== activeId) return c;
        const firstUserMessage = messages.find((m) => m.role === "user");
        const title = firstUserMessage
          ? firstUserMessage.content.slice(0, 40) + (firstUserMessage.content.length > 40 ? "..." : "")
          : "Nueva conversación";
        return { ...c, messages, title, updatedAt: Date.now() };
      });
      saveConversations(updated);
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen, showSlowNotice]);

  useEffect(() => {
    if (variant !== "header") return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [variant]);

  function handleNewChat() {
    sessionIdRef.current += 1;
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setShowSlowNotice(false);

    const fresh = makeNewConversation();
    setConversations((prev) => {
      const updated = [...prev, fresh];
      saveConversations(updated);
      return updated;
    });
    setActiveId(fresh.id);
    setMessages(fresh.messages);
    setShowHistory(false);
  }

  function handleSelectConversation(conversation: Conversation) {
    sessionIdRef.current += 1;
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setShowSlowNotice(false);

    setActiveId(conversation.id);
    setMessages(conversation.messages);
    setShowHistory(false);
  }

  async function sendMessage() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const requestSessionId = sessionIdRef.current;
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setShowSlowNotice(false);
    setWaitingMessage(cuteWaitingMessages[Math.floor(Math.random() * cuteWaitingMessages.length)]);

    const controller = new AbortController();
    abortControllerRef.current = controller;
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

      if (sessionIdRef.current !== requestSessionId) return;

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Lo siento, tuve un problema. Intenta de nuevo." },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      if (sessionIdRef.current !== requestSessionId) return;

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
      if (sessionIdRef.current === requestSessionId) {
        setShowSlowNotice(false);
        setIsLoading(false);
      }
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const sortedConversations = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory((v) => !v)}
            className={`rounded p-1.5 transition hover:bg-white/10 ${
              showHistory ? "text-brand-yellow" : "text-white/70 hover:text-white"
            }`}
            title="Ver conversaciones anteriores"
          >
            <History size={16} />
          </button>
          <button
            onClick={handleNewChat}
            className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
            title="Nueva conversación"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-2">
          {sortedConversations.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted">Sin conversaciones guardadas.</p>
          ) : (
            <div className="space-y-1">
              {sortedConversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectConversation(c)}
                  className={`flex w-full flex-col items-start rounded-md px-3 py-2 text-left transition ${
                    c.id === activeId
                      ? "bg-brand-yellow/15"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <span className="w-full truncate text-sm text-foreground">{c.title}</span>
                  <span className="text-xs text-muted">{relativeDate(c.updatedAt)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
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
                  <p className="mt-1.5 text-[11px] text-muted">{waitingMessage}</p>
                  {showSlowNotice ? (
                    <p className="mt-1 text-[11px] text-muted">
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
      )}
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
          <NoviAvatar size={26} />
        </button>

        {isOpen ? (
          <div className="fixed inset-x-4 top-16 z-50 flex h-[70vh] origin-top animate-panel-in flex-col overflow-hidden rounded-lg border border-black/10 bg-surface shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:h-[480px] sm:w-96 dark:border-white/10">
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