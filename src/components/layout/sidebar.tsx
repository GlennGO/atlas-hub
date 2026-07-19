"use client";

import { Home, FolderKanban, FileText, CheckSquare, Bot, BarChart3, Settings, Plus } from "lucide-react";

// Slugs en español — el locale se prependa al href en runtime
const navItems = [
  { key: "home", icon: Home, href: "/" },
  { key: "projects", icon: FolderKanban, href: "/proyectos" },
  { key: "files", icon: FileText, href: "/archivos" },
  { key: "tasks", icon: CheckSquare, href: "/tareas" },
  { key: "agent", icon: Bot, href: "/agente" },
  { key: "metrics", icon: BarChart3, href: "/metricas" },
  { key: "settings", icon: Settings, href: "/configuracion" },
] as const;

interface SidebarProps {
  t: (key: string) => string;
  activeRoute: string;
  locale: string;
}

export function Sidebar({ t, activeRoute, locale }: SidebarProps) {
  // Construye el href con prefijo de locale: "/" -> "/es", "/proyectos" -> "/es/proyectos"
  const buildHref = (href: string) =>
    href === "/" ? `/${locale}` : `/${locale}${href}`;

  return (
    <aside className="hidden md:flex flex-col w-60 h-screen border-r border-app bg-app sticky top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-app">
        <div className="w-8 h-8 rounded-lg bg-accent-indigo flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="font-semibold text-primary text-lg tracking-tight">
          Atlas Hub
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.href;
          return (
            <a
              key={item.key}
              href={buildHref(item.href)}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent-indigo/10 text-accent-indigo"
                  : "text-secondary hover:text-primary hover:bg-hover"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(`Nav.${item.key}`)}
            </a>
          );
        })}
      </nav>

      {/* New Project button */}
      <div className="p-3 border-t border-app">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 transition-colors">
          <Plus className="w-4 h-4" />
          {t("Home.newProject")}
        </button>
      </div>
    </aside>
  );
}
