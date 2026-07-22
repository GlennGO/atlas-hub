import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GLENNGO_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const HERMES_WEBHOOK_SECRET =
  process.env.HERMES_WEBHOOK_SECRET || "glenngo-atlas-hermes-2026";

// POST /api/webhooks/hermes → Webhook receptor para actualizaciones de Hermes
// NO requiere auth de Supabase — usa un secret token en el body o header
// Body: { secret, taskId, status, message }
//   - secret: token de autenticación
//   - taskId: ID de la tarea a actualizar
//   - status: nuevo estado de la tarea (todo, in_progress, review, done, blocked)
//   - message: mensaje descriptivo del resultado (opcional)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, taskId, status, message } = body;

    // Validar secret — puede venir en el body o en el header x-hermes-secret
    const headerSecret =
      request.headers.get("x-hermes-secret") ||
      request.headers.get("x-webhook-secret");

    const providedSecret = secret || headerSecret;

    if (providedSecret !== HERMES_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "No autorizado: secret inválido" },
        { status: 401 }
      );
    }

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId es requerido" },
        { status: 400 }
      );
    }

    // Validar status si se proporciona
    const validStatuses = ["todo", "in_progress", "review", "done", "blocked"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `status debe ser uno de: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Buscar la tarea actual
    const { data: existingTask, error: fetchError } = await supabaseAdmin
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json(
        { error: "Tarea no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar la tarea si se proporciona un status válido
    let updatedTask = existingTask;
    if (status) {
      const { data: task, error: updateError } = await supabaseAdmin
        .from("tasks")
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", taskId)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      updatedTask = task;
    }

    // Crear evento de actividad registrado por Hermes
    const eventType =
      status === "done"
        ? "hermes_task_completed"
        : status === "review"
          ? "hermes_task_in_review"
          : status === "in_progress"
            ? "hermes_task_processing"
            : "hermes_task_update";

    await supabaseAdmin.from("activity_events").insert({
      tenant_id: GLENNGO_TENANT_ID,
      project_id: existingTask.project_id,
      type: eventType,
      payload: {
        taskId,
        taskTitle: existingTask.title,
        previousStatus: existingTask.status,
        newStatus: status || existingTask.status,
        message: message || null,
        source: "hermes",
      },
      actor: "hermes:agent",
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
