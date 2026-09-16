interface GeminiMessage {
  role: "user" | "model";
  content: string;
}

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

interface FunctionCallResult {
  type: "text";
  text: string;
} 

interface FunctionCallRequest {
  type: "function_call";
  name: string;
  args: Record<string, unknown>;
}

export type GeminiResult = FunctionCallResult | FunctionCallRequest;

export async function askGemini(
  systemPrompt: string,
  messages: GeminiMessage[],
  tools?: FunctionDeclaration[],
): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está configurada");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: messages.map((m) => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  };

  if (tools && tools.length > 0) {
    body.tools = [{ function_declarations: tools }];
  }

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
  const parts = data?.candidates?.[0]?.content?.parts;

  if (!parts || parts.length === 0) {
    console.error("Respuesta de Gemini sin contenido:", JSON.stringify(data));
    throw new Error("Respuesta vacía de la IA");
  }

  const functionCallPart = parts.find((p: { functionCall?: unknown }) => p.functionCall);
  if (functionCallPart) {
    const call = functionCallPart.functionCall as { name: string; args: Record<string, unknown> };
    return { type: "function_call", name: call.name, args: call.args ?? {} };
  }

  const text = parts.find((p: { text?: string }) => p.text)?.text;
  if (!text) {
    console.error("Respuesta de Gemini sin texto ni function call:", JSON.stringify(data));
    throw new Error("Respuesta vacía de la IA");
  }

  return { type: "text", text };
}