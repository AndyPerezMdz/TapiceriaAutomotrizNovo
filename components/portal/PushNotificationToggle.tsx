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

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(subscription.toJSON()),
      });
    } catch {
      // Si algo falla en la suscripción, el usuario puede intentar de nuevo.
    }

    setIsLoading(false);
  }

  if (status === "ios-needs-install") {
    return (
      <div className="rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
        <div className="mb-2 flex items-center gap-2.5">
          <Bell size={16} className="text-muted" />
          <p className="text-sm font-medium text-foreground">Activar notificaciones</p>
        </div>
        <p className="mb-3 text-xs text-muted">
          En iPhone, primero necesitas agregar esta página a tu pantalla de inicio para poder
          recibir notificaciones:
        </p>
        <ol className="space-y-2 text-xs text-foreground">
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-[10px] font-semibold text-brand-yellow-dark dark:text-brand-yellow">
              1
            </span>
            Toca el ícono de compartir <Share size={13} className="inline" /> en la barra de
            Safari.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-[10px] font-semibold text-brand-yellow-dark dark:text-brand-yellow">
              2
            </span>
            Elige <SquarePlus size={13} className="inline" /> &quot;Agregar a pantalla de
            inicio&quot;.
          </li>
          <li className="flex items-center gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-yellow/20 text-[10px] font-semibold text-brand-yellow-dark dark:text-brand-yellow">
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
      <div className="flex items-center gap-2.5 rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
        <BellOff size={16} className="text-muted" />
        <div>
          <p className="text-sm font-medium text-foreground">Notificaciones no disponibles</p>
          <p className="text-xs text-muted">
            Tu navegador actual no soporta esta función.
          </p>
        </div>
      </div>
    );
  }

  if (status === "granted") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
        <Bell size={16} className="text-brand-yellow-dark dark:text-brand-yellow" />
        <div>
          <p className="text-sm font-medium text-foreground">Notificaciones activadas</p>
          <p className="text-xs text-muted">Vas a recibir avisos en este dispositivo.</p>
        </div>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-black/10 bg-surface p-4 dark:border-white/10">
        <BellOff size={16} className="text-muted" />
        <div>
          <p className="text-sm font-medium text-foreground">Notificaciones bloqueadas</p>
          <p className="text-xs text-muted">
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
      className="flex w-full items-center gap-2.5 rounded-lg border border-black/10 bg-surface p-4 text-left transition hover:border-brand-yellow-dark disabled:opacity-60 dark:border-white/10 dark:hover:border-brand-yellow"
    >
      <Bell size={16} className="text-muted" />
      <div>
        <p className="text-sm font-medium text-foreground">
          {isLoading ? "Activando..." : "Activar notificaciones"}
        </p>
        <p className="text-xs text-muted">
          Recibe avisos aunque no tengas la página abierta.
        </p>
      </div>
    </button>
  );
}