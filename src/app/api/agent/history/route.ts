import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GLENNGO_TENANT = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from("agent_messages")
      .select("id, direction, content, status, created_at")
      .eq("tenant_id", GLENNGO_TENANT)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("History fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (err) {
    console.error("Agent history error:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
