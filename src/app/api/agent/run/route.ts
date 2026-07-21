import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Tenant fijo de GlennGO (seed en schema.sql)
const GLENNGO_TENANT = "00000000-0000-0000-0000-000000000001";

const SYSTEM_PROMPT = `Eres el asistente de IA de Atlas Hub, el command center de GlennGO.

IMPORTANTE — TUS LIMITACIONES REALES:
- Eres un CHATBOT de conversación. NO tienes acceso a herramientas.
- NO puedes crear tareas, proyectos, o modificar la base de datos.
- NO puedes acceder al Kanban, ToDos, o sistema de archivos.
- NO eres "Hermes" (Hermes es el agente del VPS con herramientas reales).
- NO inventes que "creaste" o "subí" algo — si no tienes la herramienta, di que NO puedes.

LO QUE SÍ PUEDES HACER:
- Responder preguntas sobre GlennGO, REPLai Pilot, y el negocio (basado en tu conocimiento).
- Brainstorming e ideas de diseño, marketing, estrategia.
- Dar consejos y recomendaciones.
- Analizar texto que el usuario te pegue.

Stack de GlennGO: Docker, Coolify, Supabase, n8n, Evolution API, Next.js.
Productos: REPLai Pilot (SaaS WhatsApp IA), Atlas Hub (donde estás), FumiPlus (cliente activo).

CEO: Glenn Gómez. Hablas español latinoamericano.
Eres pragmático, directo y conciso. Cuando algo está fuera de tu alcance, lo dices claramente.
Si Glenn necesita que algo se EJECUTE (crear tarea, modificar sistema), dile que lo pida por Telegram a Hermes (el agente del VPS).`;

interface HistoryItem {
  direction: "outbound" | "inbound";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar auth
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // 2. Parsear mensaje
    const body = await request.json();
    const { message, history = [] } = body as {
      message: string;
      history?: HistoryItem[];
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }

    // 3. Guardar mensaje del usuario
    await supabaseAdmin.from("agent_messages").insert({
      tenant_id: GLENNGO_TENANT,
      direction: "outbound",
      content: message.trim(),
      status: "sent",
    });

    // 4. Construir messages para el LLM
    const llmMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10).map((h: HistoryItem) => ({
        role: h.direction === "outbound" ? "user" : "assistant",
        content: h.content,
      })),
      { role: "user", content: message.trim() },
    ];

    // 5. Llamar Gemini (Google AI Studio) — GRATIS, 1500 req/día
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Guardar mensaje de error
      await supabaseAdmin.from("agent_messages").insert({
        tenant_id: GLENNGO_TENANT,
        direction: "inbound",
        content: "⚠️ El agente no está configurado. Falta GEMINI_API_KEY.",
        status: "error",
      });
      return NextResponse.json(
        { error: "GEMINI_API_KEY no configurado" },
        { status: 500 }
      );
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const llmResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: llmMessages,
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!llmResponse.ok) {
      const errText = await llmResponse.text();
      console.error("Gemini error:", llmResponse.status, errText);

      await supabaseAdmin.from("agent_messages").insert({
        tenant_id: GLENNGO_TENANT,
        direction: "inbound",
        content: `⚠️ Error del proveedor de IA (${llmResponse.status}). Intenta de nuevo.`,
        status: "error",
      });

      return NextResponse.json(
        { error: "LLM call failed", details: errText.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = await llmResponse.json();
    const aiContent: string =
      data.choices?.[0]?.message?.content || "Sin respuesta del modelo.";

    // 6. Guardar respuesta de la IA
    await supabaseAdmin.from("agent_messages").insert({
      tenant_id: GLENNGO_TENANT,
      direction: "inbound",
      content: aiContent,
      status: "completed",
    });

    // 7. Responder
    return NextResponse.json({
      content: aiContent,
      role: "assistant",
    });
  } catch (err) {
    console.error("Agent run error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
