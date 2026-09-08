import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY!,
      response: token,
    }),
  });

  const data = await res.json();
    if (!data.success) {
    console.error("Turnstile rechazado:", data["error-codes"]);
  }

  return NextResponse.json({
    success: data.success === true,
    errorCodes: data["error-codes"] ?? [],
  });
}