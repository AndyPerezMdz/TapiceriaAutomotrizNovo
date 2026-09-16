import { askGemini } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT_BASE = `Eres "Novi", el asistente virtual de Tapicería Automotriz by NOVO, un taller de tapicería automotriz en Mérida, Yucatán.

Reglas importantes:
- Responde siempre en español, de forma amable, breve y directa.
- SOLO usa la información que se te proporciona en el contexto. Nunca inventes precios, horarios, ni datos que no estén ahí.
- Si no tienes la información para responder algo, dilo honestamente.
- Los precios que menciones son siempre "de referencia" — el precio final lo confirma el taller al revisar cada solicitud.
- No das consejos técnicos de mecánica ni de otros temas fuera de tapicería automotriz.
- Sé conciso: respuestas de 2-4 líneas normalmente, salvo que te pidan más detalle.
- Cuando sea útil llevar al usuario a una pantalla específica del sitio, agrega al FINAL de tu respuesta una etiqueta con este formato exacto: [BOTON:Texto del botón|/ruta]. Ejemplos de rutas disponibles según a quién le hables:
  - Para un cliente: /portal (mis pedidos), /portal/nuevo-pedido (cotizar), /portal/pedidos (historial), /portal/mis-citas, /portal/cupones, /portal/puntos, /portal/quejas, /portal/referidos.
  - Para staff: /admin/pedidos, /admin/citas, /admin/quejas, /admin/clientes.
  - Usa como máximo UN botón por respuesta, solo cuando de verdad ayude a la persona a llegar a donde necesita. No lo uses en cada mensaje.
- Si un CLIENTE describe un problema o necesidad relacionada con tapicería (por ejemplo "se me rompió el asiento", "quiero cambiar la alfombra", "el volante está gastado"), identifica cuál servicio del catálogo aplica mejor y sugiere el botón así: [BOTON:Cotizar <nombre del servicio>|/portal/nuevo-pedido?service=<id exacto del servicio>]. Solo hazlo si estás razonablemente seguro de que el servicio aplica; si no hay un servicio claro, no inventes uno.

Política de garantía: todos los trabajos realizados por el taller cuentan con garantía. Si un cliente nota algún detalle después de recibir su vehículo, debe contactar al taller y se revisa sin costo adicional.

Política de quejas: si un cliente tuvo un problema con un pedido ya entregado, puede levantar una queja desde el detalle de ese pedido en su portal (botón "¿Tuviste un problema con este pedido?"), o puede reportarlo por WhatsApp para que el staff la registre. Puede ver el estado de sus quejas (Abierta, Atendida, Cerrada) en la sección "Mis quejas" de su cuenta, y una vez atendida, puede calificar qué tan bien se resolvió.`;

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

    // Catálogo de servicios (para que Novi pueda sugerir el correcto)
    const { data: services } = await supabase
      .from("services")
      .select("id, title, short_description")
      .eq("is_active", true)
      .order("order", { ascending: true });

    if (services && services.length > 0) {
      contextText += "\nCatálogo de servicios disponibles (usa el id exacto para armar el link):\n";
      services.forEach((s) => {
        contextText += `- ${s.title} (id: ${s.id}): ${s.short_description}\n`;
      });
    }

    // Cupones generales activos
    const { data: generalCoupons } = await supabase
      .from("coupons")
      .select("title, description, discount_type, discount_value, audience, expires_at, services(title)")
      .eq("is_active", true)
      .is("client_id", null);

    if (generalCoupons && generalCoupons.length > 0) {
      contextText += "\nCupones de descuento activos actualmente:\n";
      generalCoupons.forEach((c) => {
        const discount =
          c.discount_type === "percentage"
            ? `${c.discount_value}%`
            : `$${c.discount_value}`;
        const service = (c.services as unknown as { title: string } | null)?.title;
        contextText += `- "${c.title}": ${discount} de descuento${service ? ` (solo en ${service})` : " (aplica a cualquier servicio)"}${c.audience === "frecuentes" ? " — solo para clientes frecuentes" : ""}${c.expires_at ? ` — vence el ${c.expires_at}` : ""}.\n`;
      });
    }

    // Programa de puntos de lealtad
    const { data: loyaltySettings } = await supabase
      .from("loyalty_settings")
      .select("pesos_per_point, points_for_reward, reward_type, reward_value")
      .eq("id", 1)
      .single();

    if (loyaltySettings) {
      const reward =
        loyaltySettings.reward_type === "percentage"
          ? `${loyaltySettings.reward_value}% de descuento`
          : `$${loyaltySettings.reward_value} de descuento`;
      contextText += `\nPrograma de puntos de lealtad: los clientes ganan 1 punto por cada $${loyaltySettings.pesos_per_point} gastados en pedidos entregados. Al acumular ${loyaltySettings.points_for_reward} puntos, pueden canjearlos por un cupón de ${reward}.\n`;
    }

    let personalizedGreeting = "";
    let roleContext = "";

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
          roleContext += `\nPedidos del cliente que está hablando contigo (${profile.full_name}):\n`;
          orders.forEach((o) => {
            const service = (o.services as unknown as { title: string } | null)?.title;
            const vehicle = [o.vehicle_make, o.vehicle_model].filter(Boolean).join(" ");
            const price = o.final_price ?? o.estimated_price;
            roleContext += `- Pedido de ${vehicle || "vehículo sin detalle"}${service ? ` (${service})` : ""}, estado: ${o.status}${price ? `, precio: $${price}` : ""}, fecha: ${new Date(o.created_at).toLocaleDateString("es-MX")}\n`;
          });
        } else {
          roleContext += `\nEl cliente ${profile.full_name} no tiene pedidos registrados todavía.\n`;
        }

        const { data: points } = await supabase
          .from("loyalty_points")
          .select("balance")
          .eq("client_id", user.id)
          .maybeSingle();

        roleContext += `\nPuntos de lealtad de este cliente: ${points?.balance ?? 0} puntos acumulados actualmente.\n`;

        const { data: personalCoupons } = await supabase
          .from("coupons")
          .select("title, discount_type, discount_value")
          .eq("is_active", true)
          .eq("client_id", user.id);

        if (personalCoupons && personalCoupons.length > 0) {
          roleContext += "\nCupones personales de este cliente (generados por canje de puntos):\n";
          personalCoupons.forEach((c) => {
            const discount =
              c.discount_type === "percentage"
                ? `${c.discount_value}%`
                : `$${c.discount_value}`;
            roleContext += `- "${c.title}": ${discount} de descuento.\n`;
          });
        }

        const { data: openComplaints } = await supabase
          .from("complaints")
          .select("status, description, order_id")
          .eq("client_id", user.id)
          .neq("status", "cerrada");

        if (openComplaints && openComplaints.length > 0) {
          roleContext += "\nQuejas abiertas o en atención de este cliente:\n";
          openComplaints.forEach((c) => {
            roleContext += `- Folio ${c.order_id.slice(0, 8).toUpperCase()}: ${c.status} — "${c.description}"\n`;
          });
        }

        personalizedGreeting = ` El cliente con el que hablas se llama ${profile.full_name}, puedes usar su nombre si es natural. Es un CLIENTE, no personal del taller.`;
      } else if (profile?.role === "admin" || profile?.role === "empleado") {
        const [
          { count: pendientes },
          { count: cotizados },
          { count: citasPendientes },
          { count: quejasAbiertas },
        ] = await Promise.all([
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "pendiente_revision")
            .is("deleted_at", null),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("status", "cotizado")
            .is("deleted_at", null),
          supabase
            .from("appointments")
            .select("*", { count: "exact", head: true })
            .eq("status", "pendiente"),
          supabase
            .from("complaints")
            .select("*", { count: "exact", head: true })
            .eq("status", "abierta"),
        ]);

        roleContext += `\nResumen operativo actual del taller:\n`;
        roleContext += `- Pedidos pendientes de revisión: ${pendientes ?? 0}\n`;
        roleContext += `- Pedidos cotizados esperando respuesta del cliente: ${cotizados ?? 0}\n`;
        roleContext += `- Citas pendientes de confirmar: ${citasPendientes ?? 0}\n`;
        roleContext += `- Quejas abiertas sin atender: ${quejasAbiertas ?? 0}\n`;

        personalizedGreeting = ` Hablas con ${profile.full_name}, quien es PERSONAL DEL TALLER (rol: ${profile.role}), no un cliente. Puedes ayudarle con preguntas operativas del negocio (cupones, puntos, políticas, resumen de pedidos, quejas), y hablarle de forma más directa y técnica que a un cliente. No le sugieras "contactar al taller por WhatsApp", porque él ES el taller.`;
      }
    }

    const systemPrompt = `${SYSTEM_PROMPT_BASE}${personalizedGreeting}\n\n${contextText}${roleContext}`;

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