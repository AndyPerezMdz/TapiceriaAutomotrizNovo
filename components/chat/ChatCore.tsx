"use client";

import { NoviAvatar } from "@/components/chat/NoviAvatar";
import { useConfirm } from "@/lib/hooks/useConfirm";
import { ArrowRight, History, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
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

interface ParsedMessage {
  text: string;
  buttonLabel: string | null;
  buttonHref: string | null;
}

function parseMessage(content: string): ParsedMessage {
  const match = content.match(/\[BOTON:([^|]+)\|([^\]]+)\]/);
  if (!match) {
    return { text: content, buttonLabel: null, buttonHref: null };
  }
  return {
    text: content.replace(match[0], "").trim(),
    buttonLabel: match[1].trim(),
    buttonHref: match[2].trim(),
  };
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

const suggestedPrompts = [
  "¿Qué servicios ofrecen?",
  "Quiero cotizar el tapizado de mis asientos",
  "¿Cómo funcionan los puntos de lealtad?",
  "¿Tienen garantía en el trabajo?",
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

export function ChatCore() {
  const { confirm, dialog } = useConfirm();
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([defaultGreeting]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSlowNotice, setShowSlowNotice] = useState(false);
  const [waitingMessage, setWaitingMessage] = useState(cuteWaitingMessages[0]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

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
  }, [messages, showSlowNotice]);

  function resetActiveRequest() {
    sessionIdRef.current += 1;
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setShowSlowNotice(false);
  }

  function handleNewChat() {
    resetActiveRequest();
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
    resetActiveRequest();
    setActiveId(conversation.id);
    setMessages(conversation.messages);
    setShowHistory(false);
  }

  async function handleDeleteConversation(id: string, e: React.MouseEvent) {
    e.stopPropagation();

    const ok = await confirm({
      title: "Eliminar conversación",
      description: "Esto elimina la conversación por completo. No se puede deshacer.",
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;

    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated);

      if (id === activeId) {
        resetActiveRequest();
        if (updated.length > 0) {
          const next = [...updated].sort((a, b) => b.updatedAt - a.updatedAt)[0];
          setActiveId(next.id);
          setMessages(next.messages);
        } else {
          const fresh = makeNewConversation();
          setActiveId(fresh.id);
          setMessages(fresh.messages);
          return [fresh];
        }
      }

      return updated;
    });
  }

  async function sendMessage(overrideText?: string) {
    const trimmed = (overrideText ?? input).trim();
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
  const isFreshConversation = messages.length === 1;

  function renderConversationRow(c: Conversation) {
    const active = c.id === activeId;
    return (
      <div
        key={c.id}
        className={`group flex items-center rounded-[10px] transition ${
          active ? "bg-white/10" : "hover:bg-white/5"
        }`}
      >
        <button
          type="button"
          onClick={() => handleSelectConversation(c)}
          className="flex min-h-12 min-w-0 flex-1 flex-col items-start justify-center px-3 py-2 text-left"
        >
          <span className={`w-full truncate text-[15px] ${active ? "font-semibold text-on-ink" : "text-[#e6e3dc]"}`}>
            {c.title}
          </span>
          <span className="text-[13px] text-on-ink-muted">{relativeDate(c.updatedAt)}</span>
        </button>
        <button
          type="button"
          onClick={(e) => handleDeleteConversation(c.id, e)}
          aria-label={`Eliminar conversación "${c.title}"`}
          className="mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-on-ink-muted transition hover:bg-brand-red/20 hover:text-[#ffb4b4] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    );
  }

  const newChatButton = (
    <button
      type="button"
      onClick={handleNewChat}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-yellow px-4 text-[15px] font-bold text-ink transition hover:bg-[#e8b90f]"
    >
      <Plus size={18} strokeWidth={2.4} /> Nueva conversación
    </button>
  );

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[520px] overflow-hidden rounded-[20px] bg-surface dark:ring-1 dark:ring-white/5">
      {dialog}

      {/* Historial (escritorio) */}
      <aside className="hidden w-72 shrink-0 flex-col bg-ink text-on-ink sm:flex">
        <div className="px-4 pb-3 pt-5">
          <p className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-yellow">
            Conversaciones
          </p>
          <div className="mt-3">{newChatButton}</div>
        </div>
        <div className="mx-4 border-t-2 border-dashed border-brand-yellow/40" />
        <div className="flex-1 space-y-0.5 overflow-y-auto p-2.5">
          {sortedConversations.length === 0 ? (
            <p className="px-3 py-4 text-sm text-on-ink-muted">Tus conversaciones aparecen aquí.</p>
          ) : (
            sortedConversations.map(renderConversationRow)
          )}
        </div>
      </aside>

      {/* Chat */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b-2 border-dashed border-seam px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-highlight p-0.5 ring-2 ring-brand-yellow">
              <NoviAvatar size={40} />
            </span>
            <div>
              <p className="flex items-center gap-1.5 font-display text-2xl font-extrabold uppercase leading-none text-foreground">
                Novi <Sparkles size={15} className="text-yellow-text" aria-hidden="true" />
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                <span className="h-2 w-2 rounded-full bg-brand-yellow" aria-hidden="true" />
                Asistente del taller · con IA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            aria-label={showHistory ? "Volver al chat" : "Ver conversaciones anteriores"}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition hover:bg-black/5 hover:text-foreground sm:hidden dark:hover:bg-white/5"
          >
            <History size={20} />
          </button>
        </header>

        {showHistory ? (
          <div className="flex-1 overflow-y-auto bg-ink p-3 text-on-ink sm:hidden">
            <div className="mb-3">{newChatButton}</div>
            {sortedConversations.map(renderConversationRow)}
          </div>
        ) : (
          <>
            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto bg-background/60 px-4 py-5 sm:px-6"
              aria-live="polite"
            >
              {isFreshConversation && !isLoading ? (
                <div className="mx-auto max-w-xl py-4 text-center">
                  <NoviAvatar size={72} className="mx-auto ring-4 ring-brand-yellow" />
                  <h1 className="mt-4 font-display text-4xl font-extrabold uppercase leading-[0.95] text-foreground sm:text-5xl">
                    ¿En qué te ayudo?
                  </h1>
                  <p className="mt-2 text-[15px] text-muted">
                    Pregúntame por servicios, precios de referencia, tu pedido o tus puntos.
                  </p>
                  <div className="mt-6 grid gap-2.5 text-left sm:grid-cols-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => sendMessage(prompt)}
                        className="flex min-h-[60px] items-center justify-between gap-3 rounded-2xl border-[1.5px] border-field-border bg-surface px-4 py-3 text-[15px] font-medium text-foreground transition hover:border-foreground"
                      >
                        {prompt}
                        <ArrowRight size={16} className="shrink-0 text-muted" aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => {
                  const parsed = m.role === "assistant" ? parseMessage(m.content) : null;
                  const mine = m.role === "user";
                  return (
                    <div key={i} className={`flex items-end gap-2.5 ${mine ? "justify-end" : "justify-start"}`}>
                      {!mine ? <NoviAvatar size={30} className="mb-0.5 shrink-0" /> : null}
                      <div
                        className={`max-w-[82%] whitespace-pre-line px-4 py-3 text-[15px] leading-relaxed sm:max-w-[72%] ${
                          mine
                            ? "rounded-[18px] rounded-br-md bg-ink text-on-ink dark:ring-1 dark:ring-white/10"
                            : "rounded-[18px] rounded-bl-md bg-surface text-foreground ring-1 ring-black/5 dark:ring-white/10"
                        }`}
                      >
                        {parsed ? parsed.text : m.content}
                        {parsed?.buttonHref && parsed?.buttonLabel ? (
                          <Link
                            href={parsed.buttonHref}
                            className="mt-3 flex min-h-11 w-fit items-center gap-2 rounded-xl bg-brand-yellow px-4 text-[15px] font-semibold text-ink transition hover:bg-[#e8b90f]"
                          >
                            {parsed.buttonLabel} <ArrowRight size={16} />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}

              {isLoading ? (
                <div className="flex items-end gap-2.5">
                  <NoviAvatar size={30} className="mb-0.5 shrink-0" />
                  <div className="max-w-[82%] rounded-[18px] rounded-bl-md bg-surface px-4 py-3 ring-1 ring-black/5 dark:ring-white/10">
                    <div className="flex items-center gap-1.5" aria-hidden="true">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-brand-yellow" />
                    </div>
                    <p className="mt-2 text-[13px] text-muted">{waitingMessage}</p>
                    {showSlowNotice ? (
                      <p className="mt-1 text-[13px] text-muted">A veces tardo un poco más de lo normal; sigo aquí.</p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-end gap-2.5 border-t-2 border-dashed border-seam bg-surface p-3 sm:px-5 sm:py-4"
            >
              <label htmlFor="novi-input" className="sr-only">
                Escribe tu pregunta para Novi
              </label>
              <textarea
                id="novi-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu pregunta…"
                rows={1}
                disabled={isLoading}
                className="max-h-32 min-h-12 flex-1 resize-none rounded-xl border-[1.5px] border-field-border bg-field px-4 py-3 text-base text-foreground outline-none transition placeholder:text-muted/70 focus:border-foreground focus:bg-surface disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                aria-label="Enviar"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-yellow text-ink transition hover:bg-[#e8b90f] disabled:opacity-40"
              >
                <Send size={19} />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
