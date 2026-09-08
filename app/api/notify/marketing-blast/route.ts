import { emailWrapper, sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/sanitize";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sendPushToAllSubscribed } from "@/lib/push/sendPush";

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data: myProfile } = await sessionClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { subject, title, message, buttonText, buttonUrl } = await request.json();

  if (!subject || !title || !message) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  if (buttonUrl && !isSafeUrl(buttonUrl)) {
    return NextResponse.json({ error: "El link del botón no es válido" }, { status: 400 });
  }

  const { data: subscribers, error: subscribersError } = await sessionClient.rpc(
    "get_marketing_subscribers",
  );

  if (subscribersError || !subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: "No hay suscritos" }, { status: 400 });
  }

  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeButtonText = buttonText ? escapeHtml(buttonText) : null;

  const html = emailWrapper(
    safeTitle,
    `
      <p style="font-size: 14px; color: #6b6b6b; line-height: 1.6; margin: 0 0 20px; white-space: pre-line;">${safeMessage}</p>
      ${
        buttonUrl && safeButtonText
          ? `<div style="text-align: center;">
              <a href="${buttonUrl}" style="display: inline-block; background-color: #f5c518; color: #1a1a1a; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 6px;">
                ${safeButtonText}
              </a>
            </div>`
          : ""
      }
      <p style="text-align: center; font-size: 11px; color: #9a9a9a; margin-top: 24px;">
        Recibiste este correo porque te suscribiste a promociones. Puedes darte de baja desde tu perfil en cualquier momento.
      </p>
    `,
  );

  const emails: string[] = subscribers.map((s: { email: string }) => s.email);

  const batchSize = 45;
  let sentCount = 0;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    const result = await sendEmail({ to: batch, subject, html });
    if (!result.error) sentCount += batch.length;
  }

  sendPushToAllSubscribed({
    title,
    body: message.length > 100 ? `${message.slice(0, 100)}...` : message,
    url: buttonUrl || "/portal",
  }).catch(() => {});

  return NextResponse.json({ success: true, sentCount, total: emails.length });
}