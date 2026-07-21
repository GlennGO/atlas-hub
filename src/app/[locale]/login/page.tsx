"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { Mail, Lock, Chrome, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/es";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Si ya hay sesión activa, redirigir
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push(redirect);
    });
  }, [router, redirect]);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        // Auto-signin después del signup
        await supabase.auth.signInWithPassword({ email, password });
      }
      router.push(redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
        },
      });
      if (err) throw err;
      // El redirect lo maneja Supabase automáticamente
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error con Google");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-app flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-accent-indigo flex items-center justify-center mb-3">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <h1 className="text-xl font-bold text-primary tracking-tight">Atlas Hub</h1>
          <p className="text-xs text-tertiary mt-1">El Hub donde tu IA crea, organiza y entrega</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-app rounded-xl p-6 space-y-5">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-hover rounded-md p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                mode === "login" ? "bg-card text-primary" : "text-tertiary hover:text-secondary"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                mode === "signup" ? "bg-card text-primary" : "text-tertiary hover:text-secondary"
              }`}
            >
              Crear cuenta
            </button>
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 border border-app rounded-md text-sm font-medium text-primary hover:bg-hover transition-colors disabled:opacity-50"
          >
            <Chrome className="w-4 h-4" />
            {mode === "login" ? "Continuar con Google" : "Registrarse con Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-app" />
            <span className="text-[10px] text-tertiary uppercase tracking-wider">o</span>
            <div className="flex-1 h-px bg-app" />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full bg-app border border-app rounded-md pl-10 pr-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none focus:border-accent-indigo"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full bg-app border border-app rounded-md pl-10 pr-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none focus:border-accent-indigo"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 bg-accent-indigo text-white rounded-md text-sm font-medium hover:bg-accent-indigo/90 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Esperá...
                </>
              ) : (
                <>
                  {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-[10px] text-tertiary text-center">
            {mode === "login" ? "¿No tenés cuenta? " : "¿Ya tenés cuenta? "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-accent-indigo hover:underline"
            >
              {mode === "login" ? "Creá una" : "Iniciá sesión"}
            </button>
          </p>
        </div>

        <p className="text-center text-[10px] text-tertiary mt-4">
          GlennGO © 2026 · Atlas Hub
        </p>
      </div>
    </div>
  );
}
