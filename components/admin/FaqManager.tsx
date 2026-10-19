"use client";

import { useConfirm } from "@/lib/hooks/useConfirm";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
  is_active: boolean;
}

const fieldClassName =
  "block w-full min-h-12 rounded-[10px] border-[1.5px] border-field-border bg-field px-3.5 py-2.5 text-base text-foreground placeholder:text-muted/70 transition focus:border-foreground focus:bg-surface focus:outline-none";
const labelClassName = "mb-1.5 block text-[15px] font-medium text-foreground";

export function FaqManager() {
  const { confirm, dialog } = useConfirm();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);

  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("faqs")
      .select("id, question, answer, order, is_active")
      .order("order", { ascending: true });
    setFaqs(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addFaq() {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    const supabase = createClient();
    await supabase.from("faqs").insert({
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      order: faqs.length,
    });
    setNewQuestion("");
    setNewAnswer("");
    load();
  }

  function startEdit(faq: Faq) {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  }

  async function saveEdit(id: string) {
    const supabase = createClient();
    await supabase
      .from("faqs")
      .update({ question: editQuestion.trim(), answer: editAnswer.trim() })
      .eq("id", id);
    setEditingId(null);
    load();
  }

  async function toggleActive(faq: Faq) {
    const supabase = createClient();
    await supabase.from("faqs").update({ is_active: !faq.is_active }).eq("id", faq.id);
    load();
  }

  async function deleteFaq(id: string, question: string) {
    const ok = await confirm({
      title: "Eliminar pregunta",
      description: `Se eliminará "${question}" de las preguntas frecuentes.`,
      confirmLabel: "Sí, eliminar",
    });
    if (!ok) return;
    const supabase = createClient();
    await supabase.from("faqs").delete().eq("id", id);
    load();
  }

  async function move(faq: Faq, direction: "up" | "down") {
    const index = faqs.findIndex((f) => f.id === faq.id);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const target = faqs[targetIndex];
    const supabase = createClient();
    await Promise.all([
      supabase.from("faqs").update({ order: target.order }).eq("id", faq.id),
      supabase.from("faqs").update({ order: faq.order }).eq("id", target.id),
    ]);
    load();
  }

  if (loading) return <p className="text-[15px] text-muted">Cargando...</p>;

  return (
    <div className="space-y-4">
      {dialog}

      {faqs.map((faq, index) => (
        <div
          key={faq.id}
          className="rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5"
        >
          {editingId === faq.id ? (
            <div className="space-y-3">
              <div>
                <label className={labelClassName}>Pregunta</label>
                <input
                  value={editQuestion}
                  onChange={(e) => setEditQuestion(e.target.value)}
                  className={fieldClassName}
                />
              </div>
              <div>
                <label className={labelClassName}>Respuesta</label>
                <textarea
                  value={editAnswer}
                  onChange={(e) => setEditAnswer(e.target.value)}
                  rows={3}
                  className={fieldClassName}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(faq.id)}
                  className="rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-4 py-2 text-[13px] font-semibold text-ink min-h-11 inline-flex items-center justify-center"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="flex items-center gap-1 rounded-xl border-[1.5px] border-field-border px-4 py-2 text-[13px] font-medium text-foreground min-h-11"
                >
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-foreground">{faq.question}</p>
                <p className="mt-1 text-[15px] text-muted">{faq.answer}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <div className="flex gap-1">
                  <button
                    onClick={() => move(faq, "up")}
                    disabled={index === 0}
                    className="rounded p-1 text-muted transition hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/5"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={() => move(faq, "down")}
                    disabled={index === faqs.length - 1}
                    className="rounded p-1 text-muted transition hover:bg-black/5 disabled:opacity-30 dark:hover:bg-white/5"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={() => startEdit(faq)}
                    className="rounded p-1 text-muted transition hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteFaq(faq.id, faq.question)}
                    className="rounded p-1 text-muted transition hover:bg-brand-red/10 hover:text-brand-red"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <button
                  onClick={() => toggleActive(faq)}
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                    faq.is_active
                      ? "bg-ink text-brand-yellow dark:ring-1 dark:ring-brand-yellow/40"
                      : "border-[1.5px] border-muted text-muted"
                  }`}
                >
                  {faq.is_active ? "Activa" : "Inactiva"}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="rounded-2xl border-2 border-dashed border-field-border p-4">
        <p className="mb-2 text-[15px] font-medium text-foreground">Agregar pregunta</p>
        <div className="space-y-2">
          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Pregunta"
            className={fieldClassName}
          />
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            rows={2}
            placeholder="Respuesta"
            className={fieldClassName}
          />
          <button
            onClick={addFaq}
            className="flex items-center gap-1 rounded-xl bg-brand-yellow hover:bg-[#e8b90f] px-3 py-1.5 text-[13px] font-semibold text-ink min-h-11"
          >
            <Plus size={14} /> Agregar
          </button>
        </div>
      </div>
    </div>
  );
}