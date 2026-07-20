"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Search,
  FolderKanban,
  FileText,
  CheckSquare,
  Bot,
  Home,
  Plus,
  CornerDownLeft,
  ArrowRight,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: typeof Home;
  href?: string;
  action?: "navigate" | "create-project" | "new-file" | "new-task" | "open-agent";
  category: "navigate" | "create" | "search";
}

interface CommandPaletteProps {
  locale: string;
  t: (key: string) => string;
}

export function CommandPalette({ locale, t }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const commands: CommandItem[] = [
    // Navigate
    {
      id: "go-home",
      label: t("Nav.home") || "Inicio",
      hint: "Dashboard principal",
      icon: Home,
      href: `/${locale}`,
      action: "navigate",
      category: "navigate",
    },
    {
      id: "go-projects",
      label: t("Nav.projects") || "Proyectos",
      hint: "Ver todos los proyectos",
      icon: FolderKanban,
      href: `/${locale}/proyectos`,
      action: "navigate",
      category: "navigate",
    },
    {
      id: "go-files",
      label: t("Nav.files") || "Archivos",
      hint: "Galería de archivos",
      icon: FileText,
      href: `/${locale}/archivos`,
      action: "navigate",
      category: "navigate",
    },
    {
      id: "go-tasks",
      label: t("Nav.tasks") || "Tareas",
      hint: "Lista de tareas",
      icon: CheckSquare,
      href: `/${locale}/tareas`,
      action: "navigate",
      category: "navigate",
    },
    {
      id: "go-agent",
      label: t("Nav.agent") || "Agente IA",
      hint: "Chat con Hermes",
      icon: Bot,
      href: `/${locale}/agente`,
      action: "navigate",
      category: "navigate",
    },
    // Create
    {
      id: "new-project",
      label: t("Home.newProject") || "Nuevo proyecto",
      hint: "Crear proyecto",
      icon: Plus,
      action: "create-project",
      category: "create",
    },
    {
      id: "new-file",
      label: "Subir archivo",
      hint: "Subir archivo a proyecto",
      icon: FileText,
      action: "new-file",
      category: "create",
    },
    {
      id: "new-task",
      label: "Nueva tarea",
      hint: "Crear tarea",
      icon: CheckSquare,
      action: "new-task",
      category: "create",
    },
    {
      id: "open-agent",
      label: "Preguntar a Hermes",
      hint: "Enviar instrucción al agente",
      icon: Bot,
      action: "open-agent",
      category: "create",
    },
  ];

  const filtered = query
    ? commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))
    : commands;

  // Group by category for display
  const grouped = filtered.reduce(
    (acc, cmd) => {
      acc[cmd.category] = acc[cmd.category] || [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {} as Record<string, CommandItem[]>,
  );

  const flatFiltered = Object.values(grouped).flat();

  const executeCommand = (cmd: CommandItem) => {
    setOpen(false);
    if (cmd.href) {
      window.location.href = cmd.href;
    } else if (cmd.action === "create-project") {
      // TODO: open modal — for now navigate to projects page
      window.location.href = `/${locale}/proyectos?new=1`;
    } else if (cmd.action === "open-agent") {
      window.location.href = `/${locale}/agente`;
    } else {
      // Other actions: toast placeholder
      console.log("Command:", cmd.action);
    }
  };

  // Keyboard nav inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flatFiltered[activeIndex]) {
      e.preventDefault();
      executeCommand(flatFiltered[activeIndex]);
    }
  };

  if (!open) return null;

  const categoryLabels: Record<string, string> = {
    navigate: "Navegar",
    create: "Crear",
    search: "Buscar",
  };

  let runningIndex = -1;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="fixed top-[20vh] left-1/2 -translate-x-1/2 z-50 w-[640px] max-w-[90vw] bg-card border border-app rounded-xl shadow-2xl overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-app">
          <Search className="w-4 h-4 text-tertiary flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar o escribir un comando..."
            className="flex-1 bg-transparent text-sm text-primary placeholder:text-tertiary outline-none"
          />
          <kbd className="text-[10px] text-tertiary bg-hover px-1.5 py-0.5 rounded font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto py-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-2">
              <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-tertiary">
                {categoryLabels[category] || category}
              </div>
              {items.map((cmd) => {
                runningIndex++;
                const isActive = runningIndex === activeIndex;
                const Icon = cmd.icon;
                const idx = runningIndex;
                return (
                  <button
                    key={cmd.id}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => executeCommand(cmd)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive ? "bg-accent-indigo/10" : "hover:bg-hover"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? "text-accent-indigo" : "text-tertiary"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          isActive ? "text-accent-indigo" : "text-primary"
                        }`}
                      >
                        {cmd.label}
                      </p>
                      {cmd.hint && (
                        <p className="text-xs text-tertiary truncate">{cmd.hint}</p>
                      )}
                    </div>
                    {isActive && (
                      <CornerDownLeft className="w-3 h-3 text-tertiary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {flatFiltered.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-tertiary">
                No se encontraron resultados para &quot;{query}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-app flex items-center justify-between text-[10px] text-tertiary">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-hover px-1 rounded">↑↓</kbd> navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-hover px-1 rounded">↵</kbd> seleccionar
            </span>
          </div>
          <span className="flex items-center gap-1">
            Atlas Hub <ArrowRight className="w-2.5 h-2.5" />
          </span>
        </div>
      </div>
    </>
  );
}
