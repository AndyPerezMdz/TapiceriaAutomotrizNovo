const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Credenciales incorrectas. Verifica tu correo y contraseña.",
  email_not_confirmed:
    "Tu correo aún no ha sido confirmado. Revisa tu bandeja de entrada.",
  user_already_registered: "Este correo ya está registrado. Inicia sesión.",
  weak_password: "La contraseña es demasiado débil. Usa al menos 8 caracteres.",
};

export function getAuthErrorMessage(error: { message?: string; code?: string }): string {
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code];
  }

  const message = error.message?.toLowerCase() ?? "";

  if (message.includes("invalid login credentials")) {
    return AUTH_ERROR_MESSAGES.invalid_credentials;
  }

  if (message.includes("email not confirmed")) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed;
  }

  if (message.includes("user already registered")) {
    return AUTH_ERROR_MESSAGES.user_already_registered;
  }

  return error.message ?? "Ocurrió un error inesperado. Intenta de nuevo.";
}
