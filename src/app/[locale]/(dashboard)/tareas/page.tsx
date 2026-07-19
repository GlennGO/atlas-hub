"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export const dynamic = "force-dynamic";

type TaskStatus = "todo" | "inProgress" | "done";
type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  project: string;
  priority: Priority;
  assignee: string;
}

const columns: { key: TaskStatus; tasks: Task[] }[] = [
  {
    key: "todo",
    tasks: [
      { id: "1", title: "Diseñar flujo de onboarding WhatsApp", project: "REPLai Pilot", priority: "high", assignee: "Hermes" },
      { id: "2", title: "Investigar competidores Etsy", project: "Etsy Digital Products", priority: "medium", assignee: "Hermes" },
      { id: "3", title: "Configurar Supabase RLS policies", project: "Atlas Hub", priority: "high", assignee: "Hermes" },
    ],
  },
  {
    key: "inProgress",
    tasks: [
      { id: "4", title: "Crear 6 páginas del dashboard", project: "Atlas Hub", priority: "high", assignee: "Claude Code" },
      { id: "5", title: "Redactar propuesta de ventas", project: "REPLai Pilot", priority: "medium", assignee: "Hermes" },
    ],
  },
  {
    key: "done",
    tasks: [
      { id: "6", title: "Deploy Atlas Hub en Coolify", project: "Atlas Hub", priority: "high", assignee: "Hermes" },
      { id: "7", title: "Configurar Evolution API", project: "REPLai Pilot", priority: "medium", assignee: "Hermes" },
      { id: "8", title: "Generar logo GlennGO", project: "GlennGO", priority: "low", assignee: "Hermes" },
    ],
  },
];

const priorityColors: Record<Priority, string> = {
  high: "bg-error/10 text-error",
  medium: "bg-warning/10 text-warning",
  low: "bg-accent-indigo/10 text-accent-indigo",
};

export default function TasksPage() {
  const t = useTranslations();

  return (
    <DashboardLayout activeRoute="/tareas" locale="es" t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-primary">{t("Tasks.title")}</h1>
          <p className="text-sm text-tertiary mt-1">{t("Tasks.subtitle")}</p>
        </div>

        {/* Kanban board — 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => (
            <div key={column.key} className="bg-card border border-app rounded-xl p-4">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-secondary">{t(`Tasks.${column.key}`)}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-hover text-tertiary">
                  {column.tasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="space-y-2">
                {column.tasks.length > 0 ? (
                  column.tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className="bg-hover border border-app rounded-lg p-3 cursor-pointer hover:border-accent-indigo/30 transition-all animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <p className="text-sm font-medium text-primary mb-1">{task.title}</p>
                      <p className="text-xs text-tertiary mb-2">{task.project}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                          {t(`Tasks.${task.priority}`)}
                        </span>
                        <span className="text-xs text-tertiary">{task.assignee}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-tertiary text-center py-4">{t("Tasks.noTasks")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
