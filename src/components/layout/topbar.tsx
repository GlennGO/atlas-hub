"use client";

import { Search, Bell, User } from "lucide-react";
import { LanguageToggle } from "@/components/dashboard/language-toggle/language-toggle";

interface TopbarProps {
  t: (key: string) => string;
  locale: string;
  onLocaleToggle: (locale: string) => void;
}

export function Topbar({ t, locale, onLocaleToggle }: TopbarProps) {
  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-app bg-app sticky top-0 z-10">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
          <input
            type="text"
            placeholder={t("Common.searchPlaceholder")}
            className="w-full pl-9 pr-4 py-1.5 rounded-md bg-card border border-app text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50 transition-all"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 md:gap-3">
        <LanguageToggle locale={locale} onToggle={onLocaleToggle} />
        
        <button className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-coral" />
        </button>

        <button className="p-1.5 rounded-md text-secondary hover:text-primary hover:bg-hover transition-colors">
          <User className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
