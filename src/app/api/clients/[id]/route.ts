import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GLENNGO_TENANT = "00000000-0000-0000-0000-000000000001";

// GET — detalle de cliente con sus proyectos
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await params;

    const { data: client, error } = await supabaseAdmin
      .from("clients")
      .select("id, name, logo_url, contact_email, contact_phone, notes, created_at")
      .eq("id", id)
      .eq("tenant_id", GLENNGO_TENANT)
      .single();

    if (error || !client) return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });

    const { data: projects } = await supabaseAdmin
      .from("projects")
      .select("id, name, status, color, description, created_at")
      .eq("client_id", id)
      .eq("tenant_id", GLENNGO_TENANT)
      .order("created_at", { ascending: false });

    const { data: files } = await supabaseAdmin
      .from("files")
      .select("id, name, type, created_at")
      .eq("tenant_id", GLENNGO_TENANT)
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      client,
      projects: projects || [],
      recent_files: files || [],
    });
  } catch (err) {
    console.error("Client detail error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — actualizar cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, string> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email?.trim() || null;
    if (body.contact_phone !== undefined) updates.contact_phone = body.contact_phone?.trim() || null;
    if (body.notes !== undefined) updates.notes = body.notes?.trim() || null;

    const { data, error } = await supabaseAdmin
      .from("clients")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", GLENNGO_TENANT)
      .select("id, name, contact_email, contact_phone, notes")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ client: data });
  } catch (err) {
    console.error("Client PATCH error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// DELETE — eliminar cliente
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { id } = await params;
    const { error } = await supabaseAdmin
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("tenant_id", GLENNGO_TENANT);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Client DELETE error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
