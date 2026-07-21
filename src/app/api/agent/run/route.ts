import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Tenant fijo de GlennGO (seed en schema.sql)
const GLENNGO_TENANT = "00000000-0000-0000-0000-000000000001";

// Marcador especial que la IA emite para indicar que quiere crear una tarea.
// El código lo parsea, ejecuta el INSERT en la DB y reemplaza el bloque por
// una confirmación en lenguaje natural.
const CREATE_TASK_MARKER = "CREATE_TASK:";

interface HistoryItem {
  direction: "outbound" | "inbound";
  content: string;
}

/**
 * Construye el system prompt dinámicamente inyectando la lista de proyectos
 * reales que existen en el tenant, para que la IA pueda referenciarlos por
 * nombre en el bloque CREATE_TASK.
 */
function buildSystemPrompt(projectNames: string[]): string {
  const projectList =
    projectNames.length > 0
      ? projectNames.map((n) => `- ${n}`).join("\n")
      : "- (aún no hay proyectos creados)";

  return `Eres el asistente de IA de Atlas Hub, el command center de GlennGO.

═══ LO QUE PUEDES HACER (HONESTO) ═══
✅ CREAR TAREAS directamente en la base de datos (cuando Glenn te lo pida).
✅ Responder preguntas sobre GlennGO, REPLai Pilot y el negocio.
✅ Brainstorming de diseño, marketing, estrategia, producto.
✅ Dar consejos, recomendaciones y análisis.
✅ Analizar texto que el usuario te pegue.

═══ LO QUE NO PUEDES HACER ═══
❌ NO puedes ELIMINAR tareas, proyectos, archivos ni nada.
❌ NO puedes acceder al sistema de archivos ni subir/descargar archivos.
❌ NO puedes ejecutar código ni comandos del sistema.
❌ NO puedes modificar tareas existentes, ni cambiar estados del Kanban.
❌ NO eres "Hermes" (Hermes es el agente del VPS con herramientas reales).
❌ NO inventes que hiciste algo que no tienes la herramienta para hacer.

Si Glenn pide algo fuera de tu alcance (borrar, ejecutar código, etc.),
dile claramente que NO puedes y sugiérele que lo pida por Telegram a Hermes.

═══ CÓMO CREAR UNA TAREA ═══
Cuando Glenn pida crear/agregar una nueva tarea (ej: "crea una tarea para
arreglar el login", "agrega esto al Kanban", "anota esto como tarea"),
respondes EXACTAMENTE con este bloque especial:

\`\`\`
CREATE_TASK: {"title": "<título descriptivo de la tarea>", "projectName": "<nombre del proyecto o null>", "priority": "<high|medium|low>"}
\`\`\`

REGLAS PARA EL BLOQUE CREATE_TASK:
1. Solo UN bloque CREATE_TASK por mensaje. Si Glenn pide varias tareas en un
   solo mensaje, pídele que las mencione una por una, o crea la más clara y
   pregunta por las demás.
2. "title" debe ser una frase corta y accionable (máx ~80 caracteres), en
   español. No incluyas el nombre del proyecto en el título.
3. "projectName" debe ser EXACTAMENTE uno de los proyectos listados abajo
   (coincidencia insensible a mayúsculas/minúsculas). Si Glenn no especifica
   proyecto, o no queda claro, usa null (la tarea se crea sin proyecto).
4. "priority": "high" si Glenn dice "urgente/crítico/ya/hoy", "low" si dice
   "baja/poco urgente/cuando se pueda", y "medium" en caso normal.
5. El bloque CREATE_TASK debe estar SOLO en una línea, sin texto markdown
   extra alrededor del JSON. Puedes agregar texto antes o después del bloque
   (ej: saludo o pregunta de aclaración), pero el JSON debe estar limpio.
6. NO uses el bloque CREATE_TASK si Glenn NO pidió crear una tarea. Si solo
   pregunta, conversa, o pide algo que no puedes hacer, responde normalmente
   en español sin el bloque.

EJEMPLOS:
  Glenn: "Crea una tarea para revisar los logs de Evolution API, es urgente"
  Tú:    CREATE_TASK: {"title": "Revisar logs de Evolution API", "projectName": "REPLai Pilot", "priority": "high"}

  Glenn: "Anotá: llamar al cliente de FumiPlus"
  Tú:    CREATE_TASK: {"title": "Llamar al cliente de FumiPlus", "projectName": "FumiPlus", "priority": "medium"}

  Glenn: "Tengo una idea para el onboarding"
  Tú:    ¡Cuéntame! ... (respuesta normal, sin bloque)

PROYECTOS DISPONIBLES (usa estos nombres exactos en projectName):
${projectList}

═══ CONTEXTO DEL NEGOCIO ═══
Stack de GlennGO: Docker, Coolify, Supabase, n8n, Evolution API, Next.js.
Productos: REPLai Pilot (SaaS WhatsApp IA), Atlas Hub (donde estás),
FumiPlus (cliente activo).
CEO: Glenn Gómez. Hablas español latinoamericano.
Eres pragmático, directo y conciso.`;
}

/**
 * Detecta y procesa un bloque CREATE_TASK en la respuesta de la IA.
 * Devuelve la respuesta final (con el bloque reemplazado por una
 * confirmación en lenguaje natural) y un flag indicando si se creó la tarea.
 */
async function processCreateTask(
  aiContent: string
): Promise<{ finalContent: string; taskCreated: boolean }> {
  // Buscar el bloque CREATE_TASK. Aceptamos con o sin triple backticks.
  const markerIdx = aiContent.indexOf(CREATE_TASK_MARKER);
  if (markerIdx === -1) {
    return { finalContent: aiContent, taskCreated: false };
  }

  // Extraer el JSON que sigue al marker (hasta el final de la línea o
  // hasta un closing ```).
  const afterMarker = aiContent.slice(markerIdx + CREATE_TASK_MARKER.length);
  // Quitar backticks iniciales
  let rest = afterMarker.trim();
  rest = rest.replace(/^```\s*/, "");
  // Tomar hasta newline o backtick de cierre
  let jsonLine = rest.split("\n")[0].replace(/```.*$/, "").trim();

  // Si el JSON continúa en varias líneas (porque la IA lo formateó bonito),
  // intentamos capturar hasta el objeto balanceado.
  if (!jsonLine.endsWith("}")) {
    const fullAfter = rest;
    const closeBrace = fullAfter.indexOf("}");
    if (closeBrace !== -1) {
      jsonLine = fullAfter.slice(0, closeBrace + 1);
    }
  }

  let parsed: {
    title?: string;
    projectName?: string | null;
    priority?: string;
  };
  try {
    parsed = JSON.parse(jsonLine);
  } catch (parseErr) {
    console.error("CREATE_TASK parse error:", parseErr, "jsonLine:", jsonLine);
    const replaced = aiContent.replace(
      aiContent.slice(markerIdx),
      "⚠️ No pude interpretar la solicitud de tarea. ¿Puedes repetirla de forma más clara?"
    );
    return { finalContent: replaced, taskCreated: false };
  }

  const title = parsed.title?.trim();
  if (!title) {
    const replaced = aiContent.replace(
      aiContent.slice(markerIdx),
      "⚠️ Falta el título de la tarea. Dime qué tarea quieres crear y la agrego."
    );
    return { finalContent: replaced, taskCreated: false };
  }

  // Validar prioridad
  const validPriorities = ["high", "medium", "low"];
  let priority = parsed.priority?.trim().toLowerCase() || "medium";
  if (!validPriorities.includes(priority)) {
    priority = "medium";
  }

  // Resolver project_id por nombre (case-insensitive)
  let projectId: string | null = null;
  let resolvedProjectName: string | null = null;
  if (parsed.projectName && parsed.projectName.trim().toLowerCase() !== "null") {
    const { data: project } = await supabaseAdmin
      .from("projects")
      .select("id, name")
      .eq("tenant_id", GLENNGO_TENANT)
      .ilike("name", parsed.projectName.trim())
      .maybeSingle();

    if (project) {
      projectId = project.id;
      resolvedProjectName = project.name;
    } else {
      // Proyecto no encontrado → creamos sin proyecto pero avisamos
      resolvedProjectName = null;
    }
  }

  // Insertar la tarea
  const { data: task, error: taskErr } = await supabaseAdmin
    .from("tasks")
    .insert({
      tenant_id: GLENNGO_TENANT,
      project_id: projectId,
      title,
      priority,
      status: "todo",
    })
    .select()
    .single();

  if (taskErr) {
    console.error("CREATE_TASK insert error:", taskErr);
    const replaced = aiContent.replace(
      aiContent.slice(markerIdx),
      `⚠️ No pude crear la tarea "${title}". Error de base de datos. Intenta de nuevo o créala desde el Kanban.`
    );
    return { finalContent: replaced, taskCreated: false };
  }

  // Registrar actividad
  await supabaseAdmin.from("activity_events").insert({
    tenant_id: GLENNGO_TENANT,
    project_id: projectId,
    type: "task_created",
    payload: { title: task.title, created_by: "agent" },
    actor: "agent:ai",
  });

  // Construir confirmación natural en español
  const priorityLabel =
    priority === "high"
      ? "alta"
      : priority === "low"
        ? "baja"
        : "media";

  let confirmation: string;
  if (resolvedProjectName) {
    confirmation = `✅ Listo, creé la tarea **"${task.title}"** en el proyecto **${resolvedProjectName}** con prioridad ${priorityLabel}. Ya la verás en el Kanban.`;
  } else if (parsed.projectName && parsed.projectName.trim().toLowerCase() !== "null") {
    confirmation = `✅ Creé la tarea **"${task.title}"** con prioridad ${priorityLabel}. ⚠️ Nota: no encontré un proyecto llamado "${parsed.projectName}", así que la dejé sin proyecto asignado. Si quieres, dime el proyecto correcto y la muevo.`;
  } else {
    confirmation = `✅ Listo, creé la tarea **"${task.title}"** con prioridad ${priorityLabel}. No la asigné a ningún proyecto.`;
  }

  // Reemplazar el bloque CREATE_TASK (y markdown circundante) por la confirmación
  const finalContent = aiContent.replace(
    aiContent.slice(markerIdx),
    confirmation
  );

  return { finalContent, taskCreated: true };
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

    // 4. Fetch de proyectos disponibles para inyectarlos en el system prompt
    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("name")
      .eq("tenant_id", GLENNGO_TENANT)
      .eq("status", "active")
      .order("name", { ascending: true });

    const projectNames: string[] = (projects || [])
      .map((p: { name: string }) => p.name)
      .filter(Boolean);

    const systemPrompt = buildSystemPrompt(projectNames);

    // 5. Construir messages para el LLM
    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...history.slice(-10).map((h: HistoryItem) => ({
        role: h.direction === "outbound" ? "user" : "assistant",
        content: h.content,
      })),
      { role: "user", content: message.trim() },
    ];

    // 6. Llamar Gemini (Google AI Studio) — GRATIS, 1500 req/día
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

    // 7. Procesar posible CREATE_TASK (función calling por output estructurado)
    const { finalContent, taskCreated } = await processCreateTask(aiContent);

    // 8. Guardar respuesta final (la que ve el usuario, ya con confirmación)
    await supabaseAdmin.from("agent_messages").insert({
      tenant_id: GLENNGO_TENANT,
      direction: "inbound",
      content: finalContent,
      status: "completed",
    });

    // 9. Responder
    return NextResponse.json({
      content: finalContent,
      role: "assistant",
      taskCreated,
    });
  } catch (err) {
    console.error("Agent run error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
