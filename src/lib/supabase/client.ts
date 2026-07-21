"use client";

import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Cliente del navegador usando @supabase/ssr
// Esto guarda la sesión en COOKIES (no localStorage)
// para que el middleware pueda leerla y proteger las rutas
export function getSupabaseBrowser() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
