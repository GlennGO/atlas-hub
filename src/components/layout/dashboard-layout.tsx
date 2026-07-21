"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/dashboard/command-palette/command-palette";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  locale: string;
  t: (key: string) => string;
}

export function DashboardLayout({
  children,
  activeRoute,
  locale: initialLocale,
  t,
}: DashboardLayoutProps) {
  const [locale, setLocale] = useState(initialLocale);

  const handleLocaleToggle = (newLocale: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas-locale", newLocale);
      // Replace current URL locale prefix and reload so server re-renders in new language
      const currentPath = window.location.pathname;
      const newPath = currentPath.replace(/^\/(es|en)/, `/${newLocale}`);
      window.location.href = newPath;
    }
  };

  return (
    <div className="flex h-screen bg-app">
      <Sidebar t={t} activeRoute={activeRoute} locale={locale} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar t={t} locale={locale} onLocaleToggle={handleLocaleToggle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette locale={locale} t={t} />
    </div>
  );
}
