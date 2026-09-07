"use client";

import { businessInfo } from "@/lib/constants/business";
import { Mail } from "lucide-react";
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

  const hasContent = title || message;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={handleSend} className="space-y-4 rounded-lg border border-black/10 bg-surface p-5 dark:border-white/10">
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
          <p className="mt-1 text-xs text-muted">
            Esto es lo que ve el cliente antes de abrir el correo, en su bandeja de entrada.
          </p>
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

      {/* Vista previa en vivo */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
          <Mail size={13} /> Así se verá el correo
        </p>
        <div className="overflow-hidden rounded-lg border border-black/10 bg-[#fafafa] dark:border-white/10">
          <div className="p-6">
            <div className="mx-auto max-w-[420px] rounded-lg border border-black/10 bg-white p-6 shadow-sm">
              <div className="mb-6 text-center">
                <p className="text-sm font-bold tracking-tight text-brand-black">
                  {businessInfo.name}
                </p>
              </div>

              <h2 className="mb-3 text-lg font-bold text-brand-black">
                {title || "Título de tu mensaje"}
              </h2>

              <p className="mb-5 whitespace-pre-line text-sm leading-relaxed text-neutral-600">
                {message || "Aquí aparecerá el contenido que escribas arriba."}
              </p>

              {buttonText ? (
                <div className="text-center">
                  <span className="inline-block rounded-md bg-brand-yellow px-6 py-2.5 text-sm font-semibold text-brand-black">
                    {buttonText}
                  </span>
                </div>
              ) : null}

              <p className="mt-6 text-center text-[11px] text-neutral-400">
                Recibiste este correo porque te suscribiste a promociones. Puedes darte de baja
                desde tu perfil en cualquier momento.
              </p>
            </div>
          </div>
        </div>

        {!hasContent ? (
          <p className="mt-2 text-xs text-muted">
            Empieza a escribir en el formulario para ver cómo se vería el correo real.
          </p>
        ) : null}
      </div>
    </div>
  );
}