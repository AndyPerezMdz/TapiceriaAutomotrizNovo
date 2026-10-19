"use client";

import { createClient } from "@/lib/supabase/client";
import { Bell, BellOff, Share, SquarePlus } from "lucide-react";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = "unsupported" | "denied" | "granted" | "default" | "ios-needs-install";

export function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>("default");
  const [isLoading, setIsLoading] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isIos && !isStandalone) {
      setStatus("ios-needs-install");
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStatus("unsupported");
      return;
    }

    setStatus(Notification.permission as "denied" | "granted" | "default");
  }, []);

  async function handleEnable() {
    setIsLoading(true);
    setDebugError(null);

    const permission = await Notification.requestPermission();
    setStatus(permission as "denied" | "granted" | "default");

    if (permission !== "granted") {
      setIsLoading(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(subscription.toJSON()),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDebugError(`Error al guardar (${res.status}): ${data.error ?? "desconocido"}`);
      }
    } catch (err) {
      setDebugError(
        `Error al suscribirse: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    setIsLoading(false);
  }

  if (debugError) {
    return (
      <div className="rounded-2xl border border-brand-red/30 bg-brand-red/5 p-4">
        <p className="text-[15px] font-medium text-brand-red">No se pudo activar</p>
        <p className="mt-1 break-words text-[13px] text-brand-red/80">{debugError}</p>
        <button
          onClick={() => setDebugError(null)}
          className="mt-2 text-[13px] font-medium text-brand-red underline"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  if (status === "ios-needs-install") {
    return (
      <div className="rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5">
        <div className="mb-2 flex items-center gap-2.5">
          <Bell size={16} className="text-muted" />
          <p className="text-[15px] font-medium text-foreground">Activar notificaciones</p>
        </div>
        <p className="mb-3 text-[13px] text-muted">
          En iPhone, primero necesitas agregar esta página a tu pantalla de inicio para poder
          recibir notificaciones:
        </p>
        <ol className="space-y-2 text-[13px] text-foreground">
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highlight text-[10px] font-semibold text-yellow-text">
              1
            </span>
            Toca el ícono de compartir <Share size={13} className="inline" /> en la barra de
            Safari.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highlight text-[10px] font-semibold text-yellow-text">
              2
            </span>
            Elige <SquarePlus size={13} className="inline" /> &quot;Agregar a pantalla de
            inicio&quot;.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-highlight text-[10px] font-semibold text-yellow-text">
              3
            </span>
            Abre la app desde el ícono nuevo en tu pantalla de inicio, y activa notificaciones
            desde ahí.
          </li>
        </ol>
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5">
        <BellOff size={16} className="text-muted" />
        <div>
          <p className="text-[15px] font-medium text-foreground">Notificaciones no disponibles</p>
          <p className="text-[13px] text-muted">
            Tu navegador actual no soporta esta función.
          </p>
        </div>
      </div>
    );
  }

  if (status === "granted") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5">
        <Bell size={16} className="text-yellow-text" />
        <div>
          <p className="text-[15px] font-medium text-foreground">Notificaciones activadas</p>
          <p className="text-[13px] text-muted">Vas a recibir avisos en este dispositivo.</p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2.5 rounded-2xl bg-surface p-5 sm:p-6 dark:ring-1 dark:ring-white/5">
        <BellOff size={16} className="text-muted" />
        <div>
          <p className="text-[15px] font-medium text-foreground">Notificaciones bloqueadas</p>
          <p className="text-[13px] text-muted">
            Las bloqueaste antes. Actívalas desde la configuración de tu navegador si cambias de
            opinión.
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleEnable}
      disabled={isLoading}
      className="flex w-full items-center gap-2.5 rounded-2xl bg-surface p-5 sm:p-6 text-left transition hover:border-brand-yellow-dark disabled:opacity-60 dark:hover:border-brand-yellow dark:ring-1 dark:ring-white/5"
    >
      <Bell size={16} className="text-muted" />
      <div>
        <p className="text-[15px] font-medium text-foreground">
          {isLoading ? "Activando..." : "Activar notificaciones"}
        </p>
        <p className="text-[13px] text-muted">
          Recibe avisos aunque no tengas la página abierta.
        </p>
      </div>
    </button>
  );
}