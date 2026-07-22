import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const GLENNGO_TENANT_ID = "00000000-0000-0000-0000-000000000001";

// POST /api/tasks/notify-hermes → Notificar a Hermes sobre una tarea
// Body: { taskId, taskTitle, taskDescription, projectName, action }
// action: "start" (task moved to in_progress) | "info" (user wants Hermes to work on it)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, taskTitle, taskDescription, projectName, action } = body;

    if (!taskId || !taskTitle) {
      return NextResponse.json(
        { error: "taskId y taskTitle son requeridos" },
        { status: 400 }
      );
    }

    if (action !== "start" && action !== "info") {
      return NextResponse.json(
        { error: "action debe ser 'start' o 'info'" },
        { status: 400 }
      );
    }

    // Obtener el project_id de la tarea para asociar el evento
    const { data: task } = await supabaseAdmin
      .from("tasks")
      .select("project_id")
      .eq("id", taskId)
      .single();

    // Almacenar la notificación como un evento de actividad
    // (No podemos alcanzar directamente Hermes desde Next.js en Coolify,
    //  así que guardamos el evento para que Hermes lo procese)
    const { error } = await supabaseAdmin.from("activity_events").insert({
      tenant_id: GLENNGO_TENANT_ID,
      project_id: task?.project_id || null,
      type: "hermes_notified",
      payload: {
        taskId,
        taskTitle,
        taskDescription: taskDescription || null,
        projectName: projectName || null,
        action,
        notifiedBy: user.email || user.id,
        notifiedAt: new Date().toISOString(),
      },
      actor: `user:${user.email || user.id}`,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
