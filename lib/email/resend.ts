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

const DISPLAY_FONT = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";
const BODY_FONT = "Barlow,'Helvetica Neue',Helvetica,Arial,sans-serif";

/**
 * Plantilla base de todos los correos, con el estilo "taller":
 * cabecera negra con el logo amarillo, costura punteada, tarjeta blanca
 * y pie con horario y contacto. Usa tablas para que se vea igual en Gmail/Outlook.
 */
export function emailWrapper(title: string, body: string, eyebrow = "Tapicería Automotriz by NOVO"): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Barlow:wght@400;600;700&display=swap" rel="stylesheet" />
</head>
<body style="margin:0;padding:0;background-color:#f3f1ec;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3f1ec;">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
      <tr><td style="background-color:#1a1a1a;border-radius:16px 16px 0 0;padding:28px 32px 22px;">
        <img src="https://tapiceriaautomotrizbynovo.com/images/logo-amarillo-wbg.png" alt="Tapicería Automotriz by NOVO" width="112" style="display:block;height:auto;border:0;" />
        <p style="margin:20px 0 0;font-family:${DISPLAY_FONT};font-weight:700;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#f5c518;">${eyebrow}</p>
        <h1 style="margin:6px 0 0;font-family:${DISPLAY_FONT};font-weight:800;font-size:32px;line-height:1;text-transform:uppercase;color:#f5f5f5;">${title}</h1>
        <div style="margin-top:20px;border-top:2px dashed #8a7322;font-size:0;line-height:0;">&nbsp;</div>
      </td></tr>
      <tr><td style="background-color:#ffffff;padding:28px 32px 32px;font-family:${BODY_FONT};font-size:15px;line-height:1.55;color:#1a1a1a;">
        ${body}
      </td></tr>
      <tr><td style="background-color:#1a1a1a;border-radius:0 0 16px 16px;padding:18px 32px 22px;font-family:${BODY_FONT};font-size:12px;line-height:1.6;color:#a8a49c;">
        <span style="font-family:${DISPLAY_FONT};font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#f5c518;">Tapicería Automotriz by NOVO</span><br />
        C. 47 694-E x 88 y 90, Cd Caucel, Mérida, Yuc.<br />
        Lun a vie 9:30 am – 5:00 pm · Sáb 9:30 am – 3:00 pm<br />
        <a href="https://tapiceriaautomotrizbynovo.com" style="color:#d9d5cc;text-decoration:underline;">tapiceriaautomotrizbynovo.com</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** Bloques reutilizables para el cuerpo de los correos. */
export const emailUi = {
  p: (html: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3d3b37;">${html}</p>`,
  small: (html: string) =>
    `<p style="margin:0 0 20px;font-size:13px;line-height:1.55;color:#5c5a55;">${html}</p>`,
  /** Sello del estado, como el de las órdenes de trabajo. */
  stamp: (label: string) =>
    `<div style="margin:4px 0 22px;"><span style="display:inline-block;border:2px solid #1a1a1a;border-radius:7px;padding:5px 12px;font-family:${DISPLAY_FONT};font-weight:800;font-size:17px;letter-spacing:1px;text-transform:uppercase;color:#1a1a1a;background-color:#f5c518;">${label}</span></div>`,
  /** Vale amarillo con costura, para precios o datos importantes. */
  vale: (label: string, value: string) =>
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;"><tr><td style="background-color:#f5c518;border-radius:12px;padding:6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border:2px dashed #8a7322;border-radius:9px;padding:14px 18px;"><span style="font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#3d3200;">${label}</span><br /><span style="font-family:${DISPLAY_FONT};font-weight:800;font-size:30px;line-height:1.1;color:#1a1a1a;">${value}</span></td></tr></table></td></tr></table>`,
  /** Nota en caja crema (respuestas del taller, comentarios). */
  note: (html: string) =>
    `<div style="margin:0 0 22px;background-color:#f3f1ec;border-left:4px solid #f5c518;border-radius:8px;padding:14px 16px;font-size:14px;line-height:1.55;color:#3d3b37;">${html}</div>`,
  button: (href: string, label: string, variant: "ink" | "yellow" = "ink") =>
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0;"><tr><td style="background-color:${variant === "ink" ? "#1a1a1a" : "#f5c518"};border-radius:10px;"><a href="${href}" style="display:inline-block;padding:14px 26px;font-family:${BODY_FONT};font-weight:700;font-size:15px;color:${variant === "ink" ? "#f5c518" : "#1a1a1a"};text-decoration:none;">${label}</a></td></tr></table>`,
};
