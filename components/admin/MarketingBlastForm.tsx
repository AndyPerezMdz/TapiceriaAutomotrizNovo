"use client";

import { businessInfo } from "@/lib/constants/business";
import { Mail } from "lucide-react";
import { useState } from "react";

const fieldClassName =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";
const labelClassName = "mb-1.5 block text-[15px] font-medium text-foreground";

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
      <form onSubmit={handleSend} className="space-y-4 rounded-2xl bg-surface p-5 sm:p-7 dark:ring-1 dark:ring-white/5">
        {result ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 px-3.5 py-2.5 text-[15px] text-green-700 dark:text-green-400">
            {result}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-brand-red/30 bg-brand-red/5 px-3.5 py-2.5 text-[15px] text-brand-red">
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
          <p className="mt-1 text-[13px] text-muted">
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
          className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-6 py-2.5 text-[15px] font-semibold text-ink transition disabled:opacity-60 min-h-11 inline-flex items-center justify-center"
        >
          {isSending ? "Enviando..." : "Enviar a suscritos"}
        </button>
      </form>

      {/* Vista previa en vivo */}
      <div>
        <p className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-muted">
          <Mail size={13} /> Así se verá el correo
        </p>
        <div className="overflow-hidden rounded-2xl border-[1.5px] border-seam bg-[#fafafa]">
          <div className="p-6">
            <div className="mx-auto max-w-[420px] rounded-2xl border-[1.5px] border-seam bg-white p-6 shadow-sm">
              <div className="mb-6 text-center">
                <p className="text-[15px] font-bold tracking-tight text-brand-black">
                  {businessInfo.name}
                </p>
              </div>

              <h2 className="mb-3 text-lg font-bold text-brand-black">
                {title || "Título de tu mensaje"}
              </h2>

              <p className="mb-5 whitespace-pre-line text-[15px] leading-relaxed text-neutral-600">
                {message || "Aquí aparecerá el contenido que escribas arriba."}
              </p>

              {buttonText ? (
                <div className="text-center">
                  <span className="inline-block rounded-xl bg-brand-yellow px-6 py-2.5 text-[15px] font-semibold text-brand-black min-h-11 inline-flex items-center justify-center">
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
          <p className="mt-2 text-[13px] text-muted">
            Empieza a escribir en el formulario para ver cómo se vería el correo real.
          </p>
        ) : null}
      </div>
    </div>
  );
}