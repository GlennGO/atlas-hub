import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const GLENNGO_TENANT_ID = "00000000-0000-0000-0000-000000000001";

// GET /api/files?projectId=xxx  →  listar archivos de un proyecto
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  let query = supabaseAdmin
    .from("files")
    .select("*")
    .eq("tenant_id", GLENNGO_TENANT_ID)
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data: files, error } = await query.limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Para cada archivo, generar signed URL de preview
  const filesWithUrls = await Promise.all(
    (files || []).map(async (file: Record<string, unknown>) => {
      const storagePath = String(file.storage_path || "");
      const { data: signedData } = await supabaseAdmin.storage
        .from("atlas-files")
        .createSignedUrl(storagePath, 3600);

      return {
        ...file,
        previewUrl: signedData?.signedUrl || null,
      };
    })
  );

  return NextResponse.json({ files: filesWithUrls });
}
