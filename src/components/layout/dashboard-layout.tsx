"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

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
    setLocale(newLocale);
    // In production this would update the URL /es or /en
    // For now we store it in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas-locale", newLocale);
    }
  };

  return (
    <div className="flex h-screen bg-app">
      <Sidebar t={t} activeRoute={activeRoute} locale={locale} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar t={t} locale={locale} onLocaleToggle={handleLocaleToggle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
