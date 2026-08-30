import { askGemini } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT_BASE = `Eres "Novi", el asistente virtual de Tapicería Automotriz by NOVO, un taller de tapicería automotriz en Mérida, Yucatán.

Reglas importantes:
- Responde siempre en español, de forma amable, breve y directa.
- SOLO usa la información que se te proporciona en el contexto. Nunca inventes precios, horarios, ni datos que no estén ahí.
- Si no tienes la información para responder algo, dilo honestamente y sugiere contactar al taller por WhatsApp (el cliente puede encontrar el botón de WhatsApp en el sitio).
- Los precios que menciones son siempre "de referencia" — el precio final lo confirma el taller al revisar cada solicitud.
- No das consejos técnicos de mecánica ni de otros temas fuera de tapicería automotriz.
- Sé conciso: respuestas de 2-4 líneas normalmente, salvo que te pidan más detalle.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body.message ?? "").trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!message || message.length > 800) {
      return NextResponse.json({ error: "Mensaje inválido" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Contexto general del negocio (siempre disponible)
    const { data: businessInfo } = await supabase
      .from("business_info")
      .select("key, value");

    let contextText = "Información del negocio:\n";
    businessInfo?.forEach((row) => {
      contextText += `- ${row.value}\n`;
    });

    // Si hay sesión de cliente, agrega SUS pedidos (respetando RLS automáticamente)
    let personalizedGreeting = "";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "cliente") {
        const { data: orders } = await supabase
          .from("orders")
          .select(
            "id, vehicle_make, vehicle_model, status, estimated_price, final_price, created_at, services(title)",
          )
          .eq("client_id", user.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(10);

        if (orders && orders.length > 0) {
          contextText += `\nPedidos del cliente que está hablando contigo (${profile.full_name}):\n`;
          orders.forEach((o) => {
            const service = (o.services as unknown as { title: string } | null)?.title;
            const vehicle = [o.vehicle_make, o.vehicle_model].filter(Boolean).join(" ");
            const price = o.final_price ?? o.estimated_price;
            contextText += `- Pedido de ${vehicle || "vehículo sin detalle"}${service ? ` (${service})` : ""}, estado: ${o.status}${price ? `, precio: $${price}` : ""}, fecha: ${new Date(o.created_at).toLocaleDateString("es-MX")}\n`;
          });
        } else {
          contextText += `\nEl cliente ${profile.full_name} no tiene pedidos registrados todavía.\n`;
        }

        personalizedGreeting = ` El cliente con el que hablas se llama ${profile.full_name}, puedes usar su nombre si es natural.`;
      }
    }

    const systemPrompt = `${SYSTEM_PROMPT_BASE}${personalizedGreeting}\n\n${contextText}`;

    const geminiMessages = [
      ...history.slice(-6).map((h: { role: string; content: string }) => ({
        role: h.role === "assistant" ? "model" : "user",
        content: String(h.content),
      })),
      { role: "user" as const, content: message },
    ];

    const reply = await askGemini(systemPrompt, geminiMessages);

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json(
      { error: "No se pudo procesar tu mensaje. Intenta de nuevo." },
      { status: 500 },
    );
  }
}