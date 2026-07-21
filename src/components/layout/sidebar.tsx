"use client";

import { useState } from "react";
import { Home, FolderKanban, FileText, CheckSquare, Bot, BarChart3, Settings, Plus, Menu, X, Building2 } from "lucide-react";

// Slugs en español — el locale se prependa al href en runtime
const navItems = [
  { key: "home", icon: Home, href: "/" },
  { key: "projects", icon: FolderKanban, href: "/proyectos" },
  { key: "clients", icon: Building2, href: "/clientes" },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Construye el href con prefijo de locale: "/" -> "/es", "/proyectos" -> "/es/proyectos"
  const buildHref = (href: string) =>
    href === "/" ? `/${locale}` : `/${locale}${href}`;

  const SidebarContent = () => (
    <>
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
              onClick={() => setMobileOpen(false)}
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
        <a
          href={`/${locale}/proyectos?new=1`}
          onClick={() => setMobileOpen(false)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("Home.newProject")}
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar (md+) */}
      <aside className="hidden md:flex flex-col w-60 h-screen border-r border-app bg-app sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile top bar with hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-app border-b border-app px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent-indigo flex items-center justify-center">
            <span className="text-white font-bold text-xs">A</span>
          </div>
          <span className="font-semibold text-primary text-base tracking-tight">
            Atlas Hub
          </span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 rounded-md hover:bg-hover transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-secondary" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-app border-r border-app flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-app">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-accent-indigo flex items-center justify-center">
                  <span className="text-white font-bold text-xs">A</span>
                </div>
                <span className="font-semibold text-primary">Atlas Hub</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 rounded hover:bg-hover"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-tertiary" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Spacer for mobile so content isn't hidden under the fixed top bar */}
      <div className="md:hidden h-14" />
    </>
  );
}
