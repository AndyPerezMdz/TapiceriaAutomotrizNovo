"use client";

import { A11Y_STORAGE_KEY, applyA11yPrefs, textSizeLabels, type TextSize } from "@/lib/a11y/preferences";
import { useEffect, useState } from "react";

const order: TextSize[] = ["normal", "grande", "extra"];

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(A11Y_STORAGE_KEY) ?? "{}") as {
      textSize?: TextSize;
      highContrast?: boolean;
      reduceMotion?: boolean;
    };
  } catch {
    return {};
  }
}

/** Botón "Aa" para agrandar la letra antes de iniciar sesión. */
export function TextSizeButton({ tone = "light" }: { tone?: "light" | "ink" }) {
  const [size, setSize] = useState<TextSize>("normal");

  useEffect(() => {
    const current = document.documentElement.dataset.textSize;
    setSize(current === "grande" || current === "extra" ? current : "normal");
  }, []);

  function cycle() {
    const next = order[(order.indexOf(size) + 1) % order.length];
    const stored = readStored();
    applyA11yPrefs({
      textSize: next,
      highContrast: Boolean(stored.highContrast),
      reduceMotion: Boolean(stored.reduceMotion),
    });
    setSize(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`Tamaño de letra: ${textSizeLabels[size]}. Toca para cambiarlo.`}
      title={`Letra: ${textSizeLabels[size]}`}
      className={`flex h-9 min-w-9 items-center justify-center gap-0.5 rounded-full border px-2.5 font-display font-extrabold leading-none transition ${
        tone === "ink"
          ? "border-white/25 text-on-ink hover:bg-white/10"
          : "border-black/15 text-foreground hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
      }`}
    >
      <span className="text-[0.8125rem]">A</span>
      <span className="text-[1.125rem]">a</span>
      {size !== "normal" ? (
        <span className="ml-1 rounded bg-brand-yellow px-1 text-[0.6875rem] text-ink">{size === "grande" ? "+" : "++"}</span>
      ) : null}
    </button>
  );
}
