"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProjectCard } from "@/components/dashboard/project-card/project-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed/activity-feed";
import { AgentChat } from "@/components/dashboard/agent-chat";
import { FolderKanban, FileText, CheckSquare, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: "active" | "paused" | "completed" | "archived";
  color: string | null;
  fileCount: number;
  taskCount: number;
  completedTasks: number;
  progress: number;
  client_name?: string | null;
}

interface ActivityEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  actor: string | null;
  created_at: string;
}

export default function HomePage() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || "es";
  const [projects, setProjects] = useState<Project[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [projRes, actRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/activity?limit=10"),
        ]);
        const projData = await projRes.json();
        const actData = await actRes.json();
        if (projData.projects) setProjects(projData.projects);
        if (actData.activity) setActivity(actData.activity);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Stats reales
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalFiles = projects.reduce((acc, p) => acc + p.fileCount, 0);
  const pendingTasks = projects.reduce(
    (acc, p) => acc + (p.taskCount - p.completedTasks),
    0
  );
  const activityToday = activity.filter((a) => {
    const today = new Date();
    const eventDate = new Date(a.created_at);
    return eventDate.toDateString() === today.toDateString();
  }).length;

  const stats = [
    { label: "Proyectos activos", value: String(activeProjects), change: `${projects.length} en total`, icon: FolderKanban, color: "text-accent-indigo" },
    { label: "Archivos totales", value: String(totalFiles), change: "en todos los proyectos", icon: FileText, color: "text-success" },
    { label: "Tareas pendientes", value: String(pendingTasks), change: `${projects.reduce((a, p) => a + p.completedTasks, 0)} completadas`, icon: CheckSquare, color: "text-warning" },
    { label: "Actividad hoy", value: String(activityToday), change: "eventos de hoy", icon: TrendingUp, color: "text-accent-coral" },
  ];

  return (
    <DashboardLayout activeRoute="/" locale={locale} t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-primary">Buenos días, Glenn</h1>
          <p className="text-sm text-tertiary mt-1">
            Esto es lo que está pasando en tu operación.
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
                <p className="text-2xl font-bold text-primary tracking-tight">
                  {loading ? "..." : stat.value}
                </p>
                <p className="text-[11px] text-tertiary mt-1">{stat.change}</p>
              </div>
            );
          })}
        </section>

        {/* Active Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">Proyectos activos</h2>
            <a href="/es/proyectos" className="text-xs text-accent-indigo hover:underline">
              Ver todos →
            </a>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-app rounded-xl p-5 h-32 animate-pulse">
                  <div className="h-4 bg-hover rounded w-2/3 mb-2" />
                  <div className="h-3 bg-hover rounded w-1/2 mb-4" />
                  <div className="h-2 bg-hover rounded w-full" />
                </div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.slice(0, 6).map((project) => (
                <a key={project.id} href={`/es/proyectos/${project.id}`}>
                  <ProjectCard
                    name={project.name}
                    client={project.client_name || "GlennGO"}
                    progress={project.progress}
                    fileCount={project.fileCount}
                    taskCount={project.taskCount}
                    status={(project.status === "archived" ? "completed" : project.status) as "active" | "paused" | "completed"}
                    t={t}
                  />
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-app border-dashed rounded-xl p-12 text-center">
              <FolderKanban className="w-10 h-10 text-tertiary mx-auto mb-3" />
              <p className="text-sm text-tertiary mb-1">No hay proyectos todavía</p>
              <a href="/es/proyectos" className="text-xs text-accent-indigo hover:underline">
                Crear el primero →
              </a>
            </div>
          )}
        </section>

        {/* Bottom grid: Activity Feed + Quick Tasks Summary */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActivityFeed t={t} />
          {/* Quick stats card replacing the oversized chat widget */}
          <div className="bg-card border border-app rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-accent-indigo" />
              <span className="font-medium text-primary text-sm">Estado del sistema</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-hover rounded-lg">
                <span className="text-sm text-secondary">Agente IA</span>
                <a href={`/${locale}/agente`} className="text-xs text-accent-indigo hover:underline">
                  Abrir chat →
                </a>
              </div>
              <div className="flex items-center justify-between p-3 bg-hover rounded-lg">
                <span className="text-sm text-secondary">Tareas pendientes</span>
                <a href={`/${locale}/tareas`} className="text-xs text-accent-indigo hover:underline">
                  Ver tablero →
                </a>
              </div>
              <div className="flex items-center justify-between p-3 bg-hover rounded-lg">
                <span className="text-sm text-secondary">Proyectos activos</span>
                <a href={`/${locale}/proyectos`} className="text-xs text-accent-indigo hover:underline">
                  Ver todos →
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
