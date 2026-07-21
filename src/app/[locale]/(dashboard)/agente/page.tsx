"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AgentChat } from "@/components/dashboard/agent-chat";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AgentPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || "es";

  return (
    <DashboardLayout activeRoute="/agente" locale={locale} t={t}>
      <div className="max-w-4xl mx-auto flex flex-col space-y-4" style={{ height: "calc(100vh - 140px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">{t("Agent.title")}</h1>
            <p className="text-sm text-tertiary mt-1">{t("Agent.subtitle")}</p>
          </div>
          {/* Online indicator */}
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-tertiary">{t("Agent.online")}</span>
          </div>
        </div>

        {/* Chat — llena el espacio restante */}
        <div className="flex-1 min-h-0">
          <AgentChat t={t} />
        </div>
      </div>
    </DashboardLayout>
  );
}
