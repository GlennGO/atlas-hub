import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GLENNGO_TENANT = "00000000-0000-0000-0000-000000000001";

// GET — listar todos los prospectos con filtros opcionales
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tier = searchParams.get("tier");
    const stage = searchParams.get("stage");
    const city = searchParams.get("city");
    const region = searchParams.get("region");

    let query = supabaseAdmin
      .from("crm_prospects")
      .select("*")
      .eq("tenant_id", GLENNGO_TENANT)
      .order("icp_score", { ascending: false });

    if (tier) query = query.eq("tier", tier);
    if (stage) query = query.eq("stage", stage);
    if (city) query = query.ilike("city", `%${city}%`);
    if (region) query = query.eq("region", region);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ prospects: data || [] });
  } catch (err) {
    console.error("CRM GET error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST — crear nuevo prospecto
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();

    const { data, error } = await supabaseAdmin
      .from("crm_prospects")
      .insert({
        tenant_id: GLENNGO_TENANT,
        company_name: body.company_name,
        tier: body.tier || "C",
        stage: body.stage || "identificado",
        city: body.city || null,
        state: body.state || null,
        region: body.region || null,
        phone: body.phone || null,
        whatsapp: body.whatsapp || null,
        email: body.email || null,
        website: body.website || null,
        facebook: body.facebook || null,
        address: body.address || null,
        icp_score: body.icp_score || 0,
        has_whatsapp: !!body.whatsapp,
        has_website: !!body.website,
        has_facebook: !!body.facebook,
        is_franchise: body.is_franchise || false,
        is_multi_state: body.is_multi_state || false,
        is_industrial: body.is_industrial || false,
        notes: body.notes || null,
        source: body.source || null,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prospect: data });
  } catch (err) {
    console.error("CRM POST error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — actualizar prospecto (cambiar stage, notas, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const allowedFields = [
      "company_name", "tier", "stage", "city", "state", "region",
      "phone", "whatsapp", "email", "website", "facebook", "address",
      "icp_score", "has_whatsapp", "has_website", "has_facebook",
      "is_franchise", "is_multi_state", "is_industrial",
      "notes", "source", "contact_date", "next_action"
    ];

    const cleanUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) cleanUpdates[key] = updates[key];
    }

    const { data, error } = await supabaseAdmin
      .from("crm_prospects")
      .update(cleanUpdates)
      .eq("id", id)
      .eq("tenant_id", GLENNGO_TENANT)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ prospect: data });
  } catch (err) {
    console.error("CRM PATCH error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
