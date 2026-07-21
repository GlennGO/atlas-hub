import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect") || "/es";

  if (code) {
    const supabaseResponse = NextResponse.redirect(`${origin}${redirect}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet, headers) {
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (err) {
      console.error("OAuth callback error:", err);
      return NextResponse.redirect(`${origin}/es/login?error=auth_callback_failed`);
    }

    return supabaseResponse;
  }

  return NextResponse.redirect(`${origin}/es/login?error=no_code`);
}
