"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Si falla, simplemente no habrá notificaciones push; no rompe nada más.
      });
    }
  }, []);

  return null;
}