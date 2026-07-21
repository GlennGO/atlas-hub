import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";

const GLENNGO_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Generar path en Supabase Storage
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const timestamp = Date.now();
    const path = `${GLENNGO_TENANT_ID}/${projectId || "unsorted"}/${timestamp}-${file.name}`;

    // Detectar tipo
    const type = detectFileType(ext, file.type);

    // Subir a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("atlas-files")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Registrar en tabla files
    const { data: fileRecord, error: dbError } = await supabaseAdmin
      .from("files")
      .insert({
        tenant_id: GLENNGO_TENANT_ID,
        project_id: projectId || null,
        name: file.name,
        type,
        mime_type: file.type,
        storage_path: path,
        size_bytes: file.size,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Generar signed URL (válido por 1h)
    const { data: signedUrlData } = await supabaseAdmin.storage
      .from("atlas-files")
      .createSignedUrl(path, 3600);

    return NextResponse.json({
      success: true,
      file: fileRecord,
      previewUrl: signedUrlData?.signedUrl || null,
    });
  } catch (err) {
    console.error("Upload API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function detectFileType(ext: string, mime: string): "document" | "image" | "video" | "audio" | "other" {
  const imageExt = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
  const videoExt = ["mp4", "webm", "mov", "avi", "mkv"];
  const audioExt = ["mp3", "wav", "ogg", "m4a", "flac"];
  const docExt = ["md", "txt", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "json", "csv"];

  if (mime.startsWith("image/") || imageExt.includes(ext)) return "image";
  if (mime.startsWith("video/") || videoExt.includes(ext)) return "video";
  if (mime.startsWith("audio/") || audioExt.includes(ext)) return "audio";
  if (docExt.includes(ext)) return "document";
  return "other";
}
