import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";
  const incomingError = searchParams.get("error_description") ?? searchParams.get("error");

  const loginPath = next.startsWith("/staff") ? "/staff/login" : "/login";

  function errorRedirect(reason: string) {
    const url = new URL(`${origin}${loginPath}`);
    url.searchParams.set("error", "link_invalido");
    url.searchParams.set("reason", reason);
    return NextResponse.redirect(url);
  }

  // Si Supabase ya mandó un error explícito antes de llegar aquí
  if (incomingError) {
    return errorRedirect(`supabase: ${incomingError}`);
  }

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("exchangeCodeForSession error:", error.message);
    return errorRedirect(`code: ${error.message}`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("verifyOtp error:", error.message);
    return errorRedirect(`otp: ${error.message}`);
  }

  return errorRedirect("sin_code_ni_token_hash");
}