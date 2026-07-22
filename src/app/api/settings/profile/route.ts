import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const GLENNGO_TENANT = "00000000-0000-0000-0000-000000000001";

const DEFAULT_PROFILE = {
  name: "Glenn Gómez",
  email: "glenn@glenngo.com",
  role: "CEO",
};

const DEFAULT_NOTIFICATIONS = {
  email: true,
  push: false,
};

type SettingsRow = {
  id: string;
  tenant_id: string;
  key: string;
  value: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

/**
 * Ensures the `settings` table exists. Returns true if the table is
 * ready (either it already existed or was created). If creation fails
 * (e.g. no RPC function available), returns false so the caller can
 * fall back to defaults.
 */
async function ensureSettingsTable(): Promise<boolean> {
  // Quick probe — if this succeeds, the table already exists.
  const { error } = await supabaseAdmin
    .from("settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!error) return true;

  // Table likely doesn't exist (error code 42P01 = undefined_table).
  // Try to create it via an RPC call if exec_sql is available.
  try {
    const rpcCall = (supabaseAdmin as unknown as {
      rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
    }).rpc("exec_sql", {
      sql: `
        create table if not exists public.settings (
          id          uuid primary key default gen_random_uuid(),
          tenant_id   uuid not null references public.tenants(id) on delete cascade,
          key         text not null,
          value       jsonb not null default '{}'::jsonb,
          created_at  timestamptz not null default now(),
          updated_at  timestamptz not null default now(),
          unique (tenant_id, key)
        );
        create index if not exists settings_tenant_id_idx on public.settings(tenant_id);
      `,
    });
    const { error: createError } = await rpcCall;

    if (createError) {
      console.warn("settings table creation failed:", createError.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("settings table creation exception:", err);
    return false;
  }
}

/** Fetch all settings rows for the tenant, typed loosely. */
async function fetchSettings(): Promise<SettingsRow[]> {
  const { data, error } = await supabaseAdmin
    .from("settings")
    .select("key, value")
    .eq("tenant_id", GLENNGO_TENANT)
    .in("key", ["profile", "notifications"]);

  if (error || !data) return [];
  return data as unknown as SettingsRow[];
}

// GET — retrieve profile + notification settings for the tenant
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const tableReady = await ensureSettingsTable();

    if (!tableReady) {
      // Table can't be created — return defaults
      return NextResponse.json({
        profile: DEFAULT_PROFILE,
        notifications: DEFAULT_NOTIFICATIONS,
      });
    }

    const rows = await fetchSettings();
    const profileRow = rows.find((r) => r.key === "profile");
    const notificationsRow = rows.find((r) => r.key === "notifications");

    const profile = {
      ...DEFAULT_PROFILE,
      ...(profileRow?.value || {}),
    };
    const notifications = {
      ...DEFAULT_NOTIFICATIONS,
      ...(notificationsRow?.value || {}),
    };

    return NextResponse.json({ profile, notifications });
  } catch (err) {
    console.error("Profile GET error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// PATCH — upsert profile and/or notification settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await request.json();
    const tableReady = await ensureSettingsTable();

    if (!tableReady) {
      return NextResponse.json(
        { error: "La tabla de configuración no está disponible. Ejecuta el esquema SQL actualizado." },
        { status: 500 }
      );
    }

    const results: { profile?: Record<string, unknown>; notifications?: Record<string, unknown> } = {};

    // ── Profile ──
    if (body.profile) {
      const profileValue: Record<string, string> = {};
      if (typeof body.profile.name === "string") profileValue.name = body.profile.name.trim();
      if (typeof body.profile.email === "string") profileValue.email = body.profile.email.trim();

      // Merge with existing value
      const rows = await fetchSettings();
      const existing = rows.find((r) => r.key === "profile");
      const mergedValue = {
        ...DEFAULT_PROFILE,
        ...((existing?.value) || {}),
        ...profileValue,
      };

      const { data, error } = await supabaseAdmin
        .from("settings")
        .upsert(
          {
            tenant_id: GLENNGO_TENANT,
            key: "profile",
            value: mergedValue,
          } as never,
          { onConflict: "tenant_id,key" }
        )
        .select("value")
        .eq("tenant_id", GLENNGO_TENANT)
        .eq("key", "profile")
        .single();

      if (error) {
        console.error("Profile upsert error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      results.profile = (data as unknown as { value: Record<string, unknown> })?.value;
    }

    // ── Notifications ──
    if (body.notifications) {
      const notifValue: Record<string, boolean> = {};
      if (typeof body.notifications.email === "boolean") notifValue.email = body.notifications.email;
      if (typeof body.notifications.push === "boolean") notifValue.push = body.notifications.push;

      const rows = await fetchSettings();
      const existing = rows.find((r) => r.key === "notifications");
      const mergedNotifValue = {
        ...DEFAULT_NOTIFICATIONS,
        ...((existing?.value) || {}),
        ...notifValue,
      };

      const { data, error } = await supabaseAdmin
        .from("settings")
        .upsert(
          {
            tenant_id: GLENNGO_TENANT,
            key: "notifications",
            value: mergedNotifValue,
          } as never,
          { onConflict: "tenant_id,key" }
        )
        .select("value")
        .eq("tenant_id", GLENNGO_TENANT)
        .eq("key", "notifications")
        .single();

      if (error) {
        console.error("Notifications upsert error:", error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      results.notifications = (data as unknown as { value: Record<string, unknown> })?.value;
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Profile PATCH error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
