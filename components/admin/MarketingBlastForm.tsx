"use client";

import { useState } from "react";

const fieldClassName =
  "w-full rounded-md border border-black/15 bg-surface px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-brand-black focus:ring-1 focus:ring-brand-black dark:border-white/15";
const labelClassName = "mb-1.5 block text-sm font-medium text-foreground";

export function MarketingBlastForm() {
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonUrl, setButtonUrl] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!confirm("¿Enviar este correo a todos los clientes suscritos?")) return;

    setIsSending(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/notify/marketing-blast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        title,
        message,
        buttonText: buttonText || undefined,
        buttonUrl: buttonUrl || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "No se pudo enviar.");
    } else {
      setResult(`Enviado a ${data.sentCount} de ${data.total} suscritos.`);
      setSubject("");
      setTitle("");
      setMessage("");
      setButtonText("");
      setButtonUrl("");
    }

    setIsSending(false);
  }

  return (
    <form onSubmit={handleSend} className="max-w-lg space-y-4 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
      {result ? (
        <div className="rounded-md border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-sm text-green-700 dark:text-green-400">
          {result}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-md border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      <div>
        <label className={labelClassName}>Asunto del correo</label>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Ej. Nuevo cupón disponible para ti"
          className={fieldClassName}
          disabled={isSending}
        />
      </div>

      <div>
        <label className={labelClassName}>Título dentro del correo</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej. Tenemos algo para ti"
          className={fieldClassName}
          disabled={isSending}
        />
      </div>

      <div>
        <label className={labelClassName}>Mensaje</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Escribe el contenido del correo..."
          className={fieldClassName}
          disabled={isSending}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClassName}>Texto del botón (opcional)</label>
          <input
            value={buttonText}
            onChange={(e) => setButtonText(e.target.value)}
            placeholder="Ver cupón"
            className={fieldClassName}
            disabled={isSending}
          />
        </div>
        <div>
          <label className={labelClassName}>Link del botón (opcional)</label>
          <input
            value={buttonUrl}
            onChange={(e) => setButtonUrl(e.target.value)}
            placeholder="https://tapiceriaautomotrizbynovo.com/portal/cupones"
            className={fieldClassName}
            disabled={isSending}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSending || !subject || !title || !message}
        className="rounded-md bg-brand-black px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-black/85 disabled:opacity-60 dark:bg-white dark:text-brand-black"
      >
        {isSending ? "Enviando..." : "Enviar a suscritos"}
      </button>
    </form>
  );
}