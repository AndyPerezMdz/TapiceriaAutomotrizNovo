
import { webpush } from "@/lib/push/vapid";
import { createAdminClient } from "@/lib/supabase/admin";

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

export async function sendPushToClient(clientId: string, payload: PushPayload) {
  const supabase = createAdminClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("client_id", clientId);

  if (!subscriptions || subscriptions.length === 0) return;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // Si el navegador ya no reconoce esa suscripción (410/404), la limpiamos
        if (statusCode === 410 || statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
}

export async function sendPushToAllSubscribed(payload: PushPayload) {
  const supabase = createAdminClient();
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (!subscriptions || subscriptions.length === 0) return { sent: 0 };

  let sent = 0;
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }),
  );
  return { sent };
}