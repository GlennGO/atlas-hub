import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const GLENNGO_TENANT_ID = "00000000-0000-0000-0000-000000000001";

// GET /api/tasks?projectId=xxx → listar tareas de un proyecto
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  let query = supabaseAdmin
    .from("tasks")
    .select("*")
    .eq("tenant_id", GLENNGO_TENANT_ID)
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data: tasks, error } = await query.limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: tasks || [] });
}

// POST /api/tasks → crear tarea
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, description, priority } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Título requerido" }, { status: 400 });
    }

    const { data: task, error } = await supabaseAdmin
      .from("tasks")
      .insert({
        tenant_id: GLENNGO_TENANT_ID,
        project_id: projectId || null,
        title: title.trim(),
        description: description?.trim() || null,
        priority: priority || "medium",
        status: "todo",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Actividad
    if (projectId) {
      await supabaseAdmin.from("activity_events").insert({
        tenant_id: GLENNGO_TENANT_ID,
        project_id: projectId,
        type: "task_created",
        payload: { title: task.title },
        actor: "user:glenn",
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks → actualizar (cambiar status, etc)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, priority, title, description } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;

    const { data: task, error } = await supabaseAdmin
      .from("tasks")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si completó una tarea, registrar actividad
    if (status === "done") {
      await supabaseAdmin.from("activity_events").insert({
        tenant_id: GLENNGO_TENANT_ID,
        project_id: task.project_id,
        type: "task_completed",
        payload: { title: task.title },
        actor: "user:glenn",
      });
    }

    // Si inició una tarea (movida a in_progress), registrar actividad
    if (status === "in_progress") {
      await supabaseAdmin.from("activity_events").insert({
        tenant_id: GLENNGO_TENANT_ID,
        project_id: task.project_id,
        type: "task_started",
        payload: { title: task.title },
        actor: "user:glenn",
      });
    }

    return NextResponse.json({ success: true, task });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks?id=xxx → eliminar tarea
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("tasks")
      .delete()
      .eq("id", id)
      .eq("tenant_id", GLENNGO_TENANT_ID);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
