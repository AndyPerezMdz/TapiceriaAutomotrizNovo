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
    return (
      <div
        key={c.id}
        className={`group flex items-center rounded-md transition ${
          c.id === activeId ? "bg-brand-yellow/15" : "hover:bg-black/5 dark:hover:bg-white/5"
        }`}
      >
        <button
          onClick={() => handleSelectConversation(c)}
          className="flex min-w-0 flex-1 flex-col items-start px-3 py-2 text-left"
        >
          <span className="w-full truncate text-sm text-foreground">{c.title}</span>
          <span className="text-xs text-muted">{relativeDate(c.updatedAt)}</span>
        </button>
        <button
          onClick={(e) => handleDeleteConversation(c.id, e)}
          className="mr-2 shrink-0 rounded p-1.5 text-muted transition hover:bg-brand-red/10 hover:text-brand-red sm:opacity-0 sm:group-hover:opacity-100"
          title="Eliminar conversación"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl overflow-hidden rounded-lg border border-black/10 bg-surface shadow-sm dark:border-white/10">
      {dialog}

      {/* Sidebar de historial, siempre visible en escritorio */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-black/10 dark:border-white/10 sm:flex">
        <div className="border-b border-black/10 p-3 dark:border-white/10">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-black px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
          >
            <Plus size={14} /> Nueva conversación
          </button>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {sortedConversations.map(renderConversationRow)}
        </div>
      </div>

      {/* Chat principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-black/10 bg-brand-black px-4 py-3 dark:border-white/10">
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
            onClick={() => setShowHistory((v) => !v)}
            className="rounded p-1.5 text-white/70 transition hover:bg-white/10 hover:text-white sm:hidden"
            title="Ver conversaciones anteriores"
          >
            <History size={16} />
          </button>
        </div>

        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-2 sm:hidden">
            <button
              onClick={handleNewChat}
              className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-brand-black"
            >
              <Plus size={14} /> Nueva conversación
            </button>
            {sortedConversations.map(renderConversationRow)}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => {
                const parsed = m.role === "assistant" ? parseMessage(m.content) : null;
                return (
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
                      {parsed ? parsed.text : m.content}
                      {parsed?.buttonHref && parsed?.buttonLabel ? (
                        <Link
                          href={parsed.buttonHref}
                          className="mt-2 flex w-fit items-center gap-1.5 rounded-md bg-brand-yellow px-3 py-1.5 text-xs font-semibold text-brand-black transition hover:bg-brand-yellow-dark"
                        >
                          {parsed.buttonLabel} <ArrowRight size={12} />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
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

              {isFreshConversation && !isLoading ? (
                <div className="pt-2">
                  <p className="mb-2 text-xs font-medium text-muted">Prueba preguntando:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="rounded-full border border-black/15 px-3 py-1.5 text-xs text-foreground transition hover:border-brand-yellow-dark hover:bg-brand-yellow/10 dark:border-white/15 dark:hover:border-brand-yellow"
                      >
                        {prompt}
                      </button>
                    ))}
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
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-black text-white transition hover:bg-brand-black/85 disabled:opacity-50 dark:bg-white dark:text-brand-black"
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}