import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GLENNGO_TENANT = "00000000-0000-0000-0000-000000000001";

// GET — obtener branding del tenant
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from("tenants")
      .select("id, name, slug, logo_url, plan")
      .eq("id", GLENNGO_TENANT)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ branding: data });
  } catch (err) {
    console.error("Branding GET error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — actualizar branding (nombre y logo)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const updates: Record<string, string> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url?.trim() || null;

    const { data, error } = await supabaseAdmin
      .from("tenants")
      .update(updates)
      .eq("id", GLENNGO_TENANT)
      .select("id, name, slug, logo_url, plan")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ branding: data });
  } catch (err) {
    console.error("Branding PATCH error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
