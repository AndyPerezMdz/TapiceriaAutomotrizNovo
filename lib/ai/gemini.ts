interface GeminiMessage {
  role: "user" | "model";
  content: string;
}

export async function askGemini(
  systemPrompt: string,
  messages: GeminiMessage[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Gemini tardó demasiado en responder (timeout)");
    }
    throw new Error("No se pudo conectar con Gemini");
  }
  clearTimeout(timeout);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Error de Gemini:", response.status, errorText);
    throw new Error(`Gemini respondió con error ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    console.error("Respuesta de Gemini sin texto:", JSON.stringify(data));
    throw new Error("Respuesta vacía de la IA");
  }

  return text;
}