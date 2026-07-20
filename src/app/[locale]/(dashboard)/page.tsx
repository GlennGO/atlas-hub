"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProjectCard } from "@/components/dashboard/project-card/project-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed/activity-feed";
import { AgentChat } from "@/components/dashboard/agent-chat";
import { FolderKanban, FileText, CheckSquare, Clock, TrendingUp } from "lucide-react";

// Force dynamic rendering to avoid next-intl static generation issues
export const dynamic = "force-dynamic";

// Mock data — will be replaced by Supabase queries
const mockProjects = [
  {
    name: "REPLai Pilot",
    client: "FumiPlus Toluca",
    progress: 75,
    fileCount: 12,
    taskCount: 5,
    status: "active" as const,
  },
  {
    name: "Atlas Hub",
    client: "GlennGO",
    progress: 35,
    fileCount: 8,
    taskCount: 3,
    status: "active" as const,
  },
  {
    name: "Etsy Digital Products",
    client: "GlennGO",
    progress: 40,
    fileCount: 15,
    taskCount: 7,
    status: "active" as const,
  },
];

// KPI cards above the project grid
const stats = [
  { label: "Proyectos activos", value: "3", change: "+1 esta semana", icon: FolderKanban, color: "text-accent-indigo" },
  { label: "Archivos totales", value: "47", change: "+8 hoy", icon: FileText, color: "text-success" },
  { label: "Tareas pendientes", value: "12", change: "3 urgentes", icon: CheckSquare, color: "text-warning" },
  { label: "Actividad hoy", value: "23", change: "+15% vs ayer", icon: TrendingUp, color: "text-accent-coral" },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <DashboardLayout activeRoute="/" locale="es" t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-primary">{t("Home.title") || "Buenos días, Glenn"}</h1>
          <p className="text-sm text-tertiary mt-1">
            Aquí está lo que pasó hoy en tu operación.
          </p>
        </div>

        {/* KPI Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card border border-app rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-tertiary font-medium">{stat.label}</span>
                  <Icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-primary tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-tertiary mt-1">{stat.change}</p>
              </div>
            );
          })}
        </section>

        {/* Active Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">
              {t("Home.activeProjects")}
            </h2>
            <a href="/es/proyectos" className="text-xs text-accent-indigo hover:underline">
              Ver todos →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockProjects.map((project) => (
              <a key={project.name} href={`/es/proyectos/${project.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <ProjectCard {...project} t={t} />
              </a>
            ))}
          </div>
        </section>

        {/* Bottom grid: Activity Feed + Agent Chat */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActivityFeed t={t} />
          <AgentChat t={t} />
        </section>
      </div>
    </DashboardLayout>
  );
}
