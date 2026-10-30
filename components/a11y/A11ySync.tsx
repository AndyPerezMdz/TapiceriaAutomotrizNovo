"use client";

import { applyA11yPrefs, type A11yPrefs } from "@/lib/a11y/preferences";
import { useEffect } from "react";

/**
 * Con sesión iniciada, las preferencias guardadas en la cuenta mandan:
 * las copia a <html> y a localStorage (así también aplican en otro dispositivo).
 */
export function A11ySync({ prefs }: { prefs: A11yPrefs }) {
  const { textSize, highContrast, reduceMotion } = prefs;
  useEffect(() => {
    applyA11yPrefs({ textSize, highContrast, reduceMotion });
  }, [textSize, highContrast, reduceMotion]);
  return null;
}
