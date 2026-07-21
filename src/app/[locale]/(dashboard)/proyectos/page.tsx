"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProjectCard } from "@/components/dashboard/project-card/project-card";
import { NewProjectModal } from "@/components/dashboard/new-project-modal/new-project-modal";
import { useState, useEffect } from "react";
import { Plus, FolderKanban } from "lucide-react";

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
}

type FilterType = "all" | "active" | "paused" | "completed";

export default function ProjectsPage() {
  const t = useTranslations();
  const [filter, setFilter] = useState<FilterType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      if (data.projects) setProjects(data.projects);
    } catch (err) {
      console.error("Error loading projects:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  // Cuando se cierra el modal después de crear, recargar
  function handleModalClose() {
    setModalOpen(false);
    // Pequeño delay para que el POST termine
    setTimeout(loadProjects, 500);
  }

  const filtered = filter === "all"
    ? projects
    : filter === "completed"
      ? projects.filter((p) => p.status === "completed" || p.status === "archived")
      : projects.filter((p) => p.status === filter);

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "active", label: "Activos" },
    { key: "paused", label: "Pausados" },
    { key: "completed", label: "Completados" },
  ];

  return (
    <DashboardLayout activeRoute="/proyectos" locale="es" t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header + New button */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">Proyectos</h1>
            <p className="text-sm text-tertiary mt-1">
              {projects.length > 0
                ? `${projects.length} proyectos · ${projects.filter(p => p.status === "active").length} activos`
                : "Organiza tu trabajo por proyecto"}
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-accent-indigo text-white text-sm font-medium rounded-md hover:bg-accent-indigo/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 border-b border-app overflow-x-auto">
          {tabs.map((tab) => {
            const count = tab.key === "all"
              ? projects.length
              : tab.key === "completed"
                ? projects.filter((p) => p.status === "completed" || p.status === "archived").length
                : projects.filter((p) => p.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filter === tab.key
                    ? "border-accent-indigo text-accent-indigo"
                    : "border-transparent text-tertiary hover:text-secondary"
                }`}
              >
                {tab.label}
                <span className="text-[10px] text-tertiary bg-hover px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
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
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <a key={project.id} href={`/es/proyectos/${project.id}`}>
                <ProjectCard
                  name={project.name}
                  client="GlennGO"
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
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderKanban className="w-12 h-12 text-tertiary mb-3" />
            <p className="text-sm text-tertiary mb-1">
              {filter === "all" ? "No hay proyectos todavía" : `No hay proyectos ${filter === "active" ? "activos" : filter === "paused" ? "pausados" : "completados"}`}
            </p>
            {filter === "all" && (
              <button
                onClick={() => setModalOpen(true)}
                className="mt-3 text-sm text-accent-indigo hover:underline"
              >
                Crear el primer proyecto
              </button>
            )}
          </div>
        )}
      </div>

      <NewProjectModal
        open={modalOpen}
        onClose={handleModalClose}
        locale="es"
        t={t}
      />
    </DashboardLayout>
  );
}
