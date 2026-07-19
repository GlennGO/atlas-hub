"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useState } from "react";
import { User, Bell, Palette, Plug, Check } from "lucide-react";

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
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DashboardLayout activeRoute="/configuracion" locale="es" t={t}>
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
                defaultValue="Glenn Gómez"
                className="w-full bg-app border border-app rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50"
              />
            </div>
            <div>
              <label className="block text-xs text-tertiary mb-1">{t("Settings.email")}</label>
              <input
                type="email"
                defaultValue="glenn@glenngo.com"
                className="w-full bg-app border border-app rounded-md px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50"
              />
            </div>
            <div>
              <label className="block text-xs text-tertiary mb-1">{t("Settings.role")}</label>
              <input
                type="text"
                defaultValue="CEO"
                disabled
                className="w-full bg-hover border border-app rounded-md px-3 py-2 text-sm text-tertiary cursor-not-allowed"
              />
            </div>
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
              <Toggle enabled={emailNotif} onChange={() => setEmailNotif(!emailNotif)} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-primary">{t("Settings.pushNotifications")}</p>
              <Toggle enabled={pushNotif} onChange={() => setPushNotif(!pushNotif)} />
            </div>
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

        {/* Save button */}
        <div className="flex items-center gap-3 pb-6">
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-md bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 transition-colors"
          >
            {t("Settings.save")}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-success animate-fade-in">
              <Check className="w-4 h-4" />
              {t("Settings.saved")}
            </span>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
