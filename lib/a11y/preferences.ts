/**
 * Preferencias de accesibilidad. Se guardan en `profiles` (viajan con la cuenta)
 * y se copian a localStorage para aplicarse antes de pintar, incluso sin sesión.
 */
export type UiMode = "normal" | "sencillo";
export type TextSize = "normal" | "grande" | "extra";

export interface A11yPrefs {
  uiMode: UiMode;
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
}

export const A11Y_STORAGE_KEY = "novo-a11y";

export const defaultA11yPrefs: A11yPrefs = {
  uiMode: "normal",
  textSize: "normal",
  highContrast: false,
  reduceMotion: false,
};

export const textSizeLabels: Record<TextSize, string> = {
  normal: "Normal",
  grande: "Grande",
  extra: "Extra grande",
};

/** Convierte la fila de `profiles` a preferencias. */
export function prefsFromProfile(row: {
  ui_mode?: string | null;
  text_size?: string | null;
  high_contrast?: boolean | null;
  reduce_motion?: boolean | null;
} | null): A11yPrefs {
  return {
    uiMode: row?.ui_mode === "sencillo" ? "sencillo" : "normal",
    textSize: row?.text_size === "grande" || row?.text_size === "extra" ? row.text_size : "normal",
    highContrast: Boolean(row?.high_contrast),
    reduceMotion: Boolean(row?.reduce_motion),
  };
}

/** Pone los atributos en <html> y guarda en localStorage. Solo en el navegador. */
export function applyA11yPrefs(prefs: Pick<A11yPrefs, "textSize" | "highContrast" | "reduceMotion">) {
  const root = document.documentElement;
  root.dataset.textSize = prefs.textSize;
  root.dataset.contrast = prefs.highContrast ? "alto" : "normal";
  root.dataset.motion = prefs.reduceMotion ? "reducido" : "normal";
  try {
    localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Navegación privada o almacenamiento bloqueado: se aplica solo en esta visita.
  }
}

/** Script que corre en <head> antes de pintar, para evitar el "salto" de tamaño. */
export const a11yBootScript = `(function(){try{var p=JSON.parse(localStorage.getItem("${A11Y_STORAGE_KEY}")||"{}");var r=document.documentElement;if(p.textSize==="grande"||p.textSize==="extra")r.dataset.textSize=p.textSize;if(p.highContrast)r.dataset.contrast="alto";if(p.reduceMotion)r.dataset.motion="reducido";}catch(e){}})();`;
