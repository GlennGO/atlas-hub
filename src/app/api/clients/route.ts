import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GLENNGO_TENANT = "00000000-0000-0000-0000-000000000001";

// GET — listar clientes con conteo de proyectos
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from("clients")
      .select("id, name, logo_url, contact_email, contact_phone, notes, created_at")
      .eq("tenant_id", GLENNGO_TENANT)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Contar proyectos por cliente
    const { data: projectCounts } = await supabaseAdmin
      .from("projects")
      .select("client_id")
      .eq("tenant_id", GLENNGO_TENANT)
      .not("client_id", "is", null);

    const counts: Record<string, number> = {};
    projectCounts?.forEach((p: { client_id: string }) => {
      const cid = p.client_id;
      if (cid) counts[cid] = (counts[cid] || 0) + 1;
    });

    const clients = (data || []).map((c: Record<string, unknown>) => ({
      ...c,
      project_count: counts[c.id as string] || 0,
    }));

    return NextResponse.json({ clients });
  } catch (err) {
    console.error("Clients GET error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST — crear cliente
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const { name, contact_email, contact_phone, notes } = body;

    if (!name?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("clients")
      .insert({
        tenant_id: GLENNGO_TENANT,
        name: name.trim(),
        contact_email: contact_email?.trim() || null,
        contact_phone: contact_phone?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select("id, name, contact_email, contact_phone, notes, created_at")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ client: { ...data, project_count: 0 } });
  } catch (err) {
    console.error("Client POST error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
