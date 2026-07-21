import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GLENNGO_TENANT_ID = "00000000-0000-0000-0000-000000000001";

// GET /api/projects → listar proyectos
// GET /api/projects?id=xxx → obtener uno específico
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("id");

  if (projectId) {
    // Detalle de un proyecto con archivos y tareas
    const [{ data: project }, { data: files }, { data: tasks }, { data: activity }] = await Promise.all([
      supabaseAdmin.from("projects").select("*").eq("id", projectId).single(),
      supabaseAdmin.from("files").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabaseAdmin.from("tasks").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabaseAdmin.from("activity_events").select("*").eq("project_id", projectId).order("created_at", { ascending: false }).limit(20),
    ]);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Generar signed URLs para archivos
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file) => {
        const { data: signedData } = await supabaseAdmin.storage
          .from("atlas-files")
          .createSignedUrl(file.storage_path, 3600);
        return { ...file, previewUrl: signedData?.signedUrl || null };
      })
    );

    return NextResponse.json({
      project,
      files: filesWithUrls,
      tasks: tasks || [],
      activity: activity || [],
    });
  }

  // Listar todos
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("tenant_id", GLENNGO_TENANT_ID)
    .order("updated_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Para cada proyecto, contar archivos y tareas
  const projectsWithCounts = await Promise.all(
    (projects || []).map(async (p) => {
      const [{ count: fileCount }, { count: taskCount }, { count: completedTasks }] = await Promise.all([
        supabaseAdmin.from("files").select("*", { count: "exact", head: true }).eq("project_id", p.id),
        supabaseAdmin.from("tasks").select("*", { count: "exact", head: true }).eq("project_id", p.id),
        supabaseAdmin.from("tasks").select("*", { count: "exact", head: true }).eq("project_id", p.id).eq("status", "done"),
      ]);
      return {
        ...p,
        fileCount: fileCount || 0,
        taskCount: taskCount || 0,
        completedTasks: completedTasks || 0,
        progress: taskCount > 0 ? Math.round(((completedTasks || 0) / taskCount) * 100) : 0,
      };
    })
  );

  return NextResponse.json({ projects: projectsWithCounts });
}

// POST /api/projects → crear proyecto nuevo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, client, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    // Si viene cliente, crear o buscar
    let clientId = null;
    if (client && client.trim()) {
      const { data: existingClient } = await supabaseAdmin
        .from("clients")
        .select("id")
        .eq("tenant_id", GLENNGO_TENANT_ID)
        .ilike("name", client.trim())
        .maybeSingle();

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientErr } = await supabaseAdmin
          .from("clients")
          .insert({ tenant_id: GLENNGO_TENANT_ID, name: client.trim() })
          .select("id")
          .single();
        if (!clientErr && newClient) clientId = newClient.id;
      }
    }

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .insert({
        tenant_id: GLENNGO_TENANT_ID,
        client_id: clientId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || "#4f46e5",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Registrar actividad
    await supabaseAdmin.from("activity_events").insert({
      tenant_id: GLENNGO_TENANT_ID,
      project_id: project.id,
      type: "project_created",
      payload: { name: project.name },
      actor: "user:glenn",
    });

    return NextResponse.json({ success: true, project });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects → actualizar
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Limpiar campos que no se pueden actualizar directo
    const allowed = ["name", "description", "status", "color", "client_id"];
    const cleanUpdates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in updates) cleanUpdates[key] = updates[key];
    }
    cleanUpdates.updated_at = new Date().toISOString();

    const { data: project, error } = await supabaseAdmin
      .from("projects")
      .update(cleanUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, project });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
