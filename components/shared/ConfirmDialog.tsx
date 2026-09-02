"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = true,
  onConfirm,
  onCancel,
  isLoading = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-lg border border-black/10 bg-surface p-6 shadow-2xl dark:border-white/10"
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              danger
                ? "bg-brand-red/10 text-brand-red"
                : "bg-brand-yellow/15 text-brand-yellow-dark dark:text-brand-yellow"
            }`}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-black/5 disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-md px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
              danger
                ? "bg-brand-red hover:bg-brand-red/85"
                : "bg-brand-black hover:bg-brand-black/85 dark:bg-white dark:text-brand-black"
            }`}
          >
            {isLoading ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}