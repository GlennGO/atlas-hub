"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AgentChat } from "@//components/dashboard/agent-chat";
import { useParams } from "next/navigation";
import { Sparkles, ListTodo, FolderKanban, Activity } from "lucide-react";
import { useState } from "react";

export const dynamic = "force-dynamic";

export default function AgentPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || "es";
  const [inputHint, setInputHint] = useState<string | null>(null);

  const quickActions = [
    {
      icon: ListTodo,
      label: "Crear tarea",
      prompt: "Crea una tarea para ",
      color: "text-accent-indigo",
    },
    {
      icon: FolderKanban,
      label: "Ver proyectos",
      prompt: "Lista mis proyectos activos",
      color: "text-success",
    },
    {
      icon: Activity,
      label: "Estado del sistema",
      prompt: "Dame un resumen del estado actual",
      color: "text-warning",
    },
  ];

  return (
    <DashboardLayout activeRoute="/agente" locale={locale} t={t}>
      <div
        className="max-w-4xl mx-auto flex flex-col space-y-4"
        style={{ height: "calc(100vh - 140px)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-indigo/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-indigo" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">
                Hermes — VP de Operaciones
              </h1>
              <p className="text-sm text-tertiary mt-0.5">
                {t("Agent.subtitle") || "Tu asistente de operaciones GlennGO"}
              </p>
            </div>
          </div>
          {/* Online indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-tertiary">
              {t("Agent.online") || "En línea"}
            </span>
          </div>
        </div>

        {/* Chat — llena el espacio restante */}
        <div className="flex-1 min-h-0">
          <AgentChat t={t} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 pb-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                // Dispatch a custom event that AgentChat can listen to
                window.dispatchEvent(
                  new CustomEvent("agent-quick-action", {
                    detail: action.prompt,
                  })
                );
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card border border-app text-xs text-secondary hover:border-accent-indigo/30 hover:text-primary transition-colors"
            >
              <action.icon size={12} className={action.color} />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
