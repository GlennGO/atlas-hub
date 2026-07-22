"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useState, useEffect, useCallback } from "react";
import { User, Bell, Palette, Plug, Check, Building2, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
export const dynamic = "force-dynamic";

// Toggle switch reutilizable
function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-10 h-6 rounded-full transition-colors ${enabled ? "bg-accent-indigo" : "bg-hover border border-app"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// Sección reutilizable
function SettingSection({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-app rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-accent-indigo" />
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || "es";

  // ── Profile state ──
  const [profileName, setProfileName] = useState("Glenn Gómez");
  const [profileEmail, setProfileEmail] = useState("glenn@glenngo.com");
  const [profileRole] = useState("CEO");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // ── Notifications state ──
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // ── Preferences (local-only for now) ──
  const [darkMode, setDarkMode] = useState(true);

  // ── Branding state ──
  const [agencyName, setAgencyName] = useState("GlennGO");
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);

  // ── Load all settings on mount ──
  useEffect(() => {
    async function loadSettings() {
      // Profile + Notifications
      try {
        const res = await fetch("/api/settings/profile");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            if (data.profile.name) setProfileName(data.profile.name);
            if (data.profile.email) setProfileEmail(data.profile.email);
          }
          if (data.notifications) {
            if (typeof data.notifications.email === "boolean") setEmailNotif(data.notifications.email);
            if (typeof data.notifications.push === "boolean") setPushNotif(data.notifications.push);
          }
        }
      } catch {
        // silent
      } finally {
        setProfileLoading(false);
      }

      // Branding
      try {
        const res = await fetch("/api/settings/branding");
        if (res.ok) {
          const data = await res.json();
          if (data.branding?.name) setAgencyName(data.branding.name);
          if (data.branding?.logo_url) setAgencyLogo(data.branding.logo_url);
        }
      } catch {
        // silent
      } finally {
        setBrandingLoading(false);
      }
    }
    loadSettings();
  }, []);

  // ── Save profile ──
  async function handleProfileSave() {
    setProfileSaving(true);
    try {
      await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: { name: profileName, email: profileEmail },
        }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      // silent
    } finally {
      setProfileSaving(false);
    }
  }

  // ── Save branding ──
  async function handleBrandingSave() {
    setBrandingSaving(true);
    try {
      await fetch("/api/settings/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: agencyName }),
      });
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 2000);
    } finally {
      setBrandingSaving(false);
    }
  }

  // ── Save notifications (debounced via toggle handler) ──
  const saveNotifications = useCallback(
    async (email: boolean, push: boolean) => {
      setNotifSaving(true);
      try {
        await fetch("/api/settings/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifications: { email, push },
          }),
        });
        setNotifSaved(true);
        setTimeout(() => setNotifSaved(false), 2000);
      } catch {
        // silent
      } finally {
        setNotifSaving(false);
      }
    },
    []
  );

  const handleEmailToggle = () => {
    const next = !emailNotif;
    setEmailNotif(next);
    saveNotifications(next, pushNotif);
  };

  const handlePushToggle = () => {
    const next = !pushNotif;
    setPushNotif(next);
    saveNotifications(emailNotif, next);
  };

  return (
    <DashboardLayout activeRoute="/configuracion" locale={locale} t={t}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-primary">{t("Settings.title")}</h1>
          <p className="text-sm text-tertiary mt-1">{t("Settings.subtitle")}</p>
        </div>

        {/* Profile */}
        <SettingSection icon={User} title={t("Settings.profile")}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-tertiary mb-1">{t("Settings.name")}</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                disabled={profileLoading}
                className="w-full bg-app border border-app rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-tertiary mb-1">{t("Settings.email")}</label>
              <input
                type="email"
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                disabled={profileLoading}
                className="w-full bg-app border border-app rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-tertiary mb-1">{t("Settings.role")}</label>
              <input
                type="text"
                value={profileRole}
                disabled
                className="w-full bg-hover border border-app rounded-md px-3 py-2 text-sm text-tertiary cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleProfileSave}
                disabled={profileSaving || profileLoading}
                className="px-3 py-2 rounded-md bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 disabled:opacity-40"
              >
                {profileSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </span>
                ) : (
                  "Guardar perfil"
                )}
              </button>
              {profileSaved && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Check className="w-3.5 h-3.5" /> Guardado
                </span>
              )}
            </div>
          </div>
        </SettingSection>

        {/* Branding */}
        <SettingSection icon={Building2} title="Branding de la agencia">
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-tertiary mb-1">Nombre de la agencia</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  disabled={brandingLoading}
                  className="flex-1 bg-app border border-app rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50"
                />
                <button
                  onClick={handleBrandingSave}
                  disabled={brandingSaving}
                  className="px-3 py-2 rounded-md bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 disabled:opacity-40 whitespace-nowrap"
                >
                  {brandingSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                </button>
              </div>
              {brandingSaved && (
                <span className="flex items-center gap-1 text-xs text-success mt-1">
                  <Check className="w-3.5 h-3.5" /> Guardado
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 pt-2 border-t border-app">
              <div className="w-12 h-12 rounded-lg bg-accent-indigo flex items-center justify-center">
                {agencyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={agencyLogo} alt="Logo" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">
                    {agencyName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-primary font-medium">{agencyName}</p>
                <p className="text-xs text-tertiary">Así se verá tu marca en el dashboard</p>
              </div>
            </div>
            <p className="text-xs text-tertiary/70">
              El logo personalizado y colores por cliente estarán disponibles en una próxima actualización.
            </p>
          </div>
        </SettingSection>

        {/* Preferences */}
        <SettingSection icon={Palette} title={t("Settings.preferences")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary">{t("Settings.theme")}</p>
                <p className="text-xs text-tertiary">{darkMode ? t("Settings.dark") : t("Settings.light")}</p>
              </div>
              <Toggle enabled={darkMode} onChange={() => setDarkMode(!darkMode)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary">{t("Settings.language")}</p>
                <p className="text-xs text-tertiary">Español (México)</p>
              </div>
              <select className="bg-app border border-app rounded-md px-3 py-1.5 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50">
                <option>Español</option>
                <option>English</option>
              </select>
            </div>
          </div>
        </SettingSection>

        {/* Notifications */}
        <SettingSection icon={Bell} title={t("Settings.notifications")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-primary">{t("Settings.emailNotifications")}</p>
              <Toggle enabled={emailNotif} onChange={handleEmailToggle} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-primary">{t("Settings.pushNotifications")}</p>
              <Toggle enabled={pushNotif} onChange={handlePushToggle} />
            </div>
            {(notifSaving || notifSaved) && (
              <div className="pt-1">
                {notifSaving ? (
                  <span className="flex items-center gap-1 text-xs text-tertiary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <Check className="w-3.5 h-3.5" /> Guardado
                  </span>
                )}
              </div>
            )}
          </div>
        </SettingSection>

        {/* Integrations */}
        <SettingSection icon={Plug} title={t("Settings.integrations")}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary">{t("Settings.supabase")}</p>
                <p className="text-xs text-tertiary">Postgres + Auth + Storage</p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                {t("Settings.connected")}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-primary">{t("Settings.evolutionAPI")}</p>
                <p className="text-xs text-tertiary">WhatsApp Business API</p>
              </div>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                {t("Settings.connected")}
              </span>
            </div>
          </div>
        </SettingSection>
      </div>
    </DashboardLayout>
  );
}
