interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY no configurada");
    return { error: "No configurado" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tapicería Automotriz by NOVO <notificaciones@tapiceriaautomotrizbynovo.com>",
      to,
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Error enviando correo:", error);
    return { error };
  }

  return { success: true };
}

export function emailWrapper(title: string, body: string): string {
  return `
    <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <img src="https://tapiceriaautomotrizbynovo.com/images/logo-negro-wbg.png" alt="Tapicería Automotriz by NOVO" width="140" style="height: auto;" />
      </div>
      <div style="background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 10px; padding: 32px;">
        <h1 style="font-size: 20px; color: #1a1a1a; margin: 0 0 12px;">${title}</h1>
        ${body}
      </div>
      <p style="text-align: center; font-size: 11px; color: #9a9a9a; margin-top: 24px;">
        Tapicería Automotriz by NOVO · Mérida, Yucatán
      </p>
    </div>
  `;
}