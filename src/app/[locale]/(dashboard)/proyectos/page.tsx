"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProjectCard } from "@/components/dashboard/project-card/project-card";
import { NewProjectModal } from "@/components/dashboard/new-project-modal/new-project-modal";
import { useState } from "react";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

// Mock data — será reemplazado por queries de Supabase
const mockProjects = [
  { name: "REPLai Pilot", client: "FumiPlus Toluca", progress: 75, fileCount: 12, taskCount: 5, status: "active" as const },
  { name: "Atlas Hub", client: "GlennGO", progress: 35, fileCount: 8, taskCount: 3, status: "active" as const },
  { name: "Etsy Digital Products", client: "GlennGO", progress: 40, fileCount: 15, taskCount: 7, status: "active" as const },
  { name: "Landing Rediseño", client: "FumiPlus Toluca", progress: 100, fileCount: 6, taskCount: 4, status: "completed" as const },
  { name: "Chatbot WhatsApp v1", client: "FumiPlus Toluca", progress: 50, fileCount: 9, taskCount: 2, status: "paused" as const },
  { name: "Investigación Mercado", client: "GlennGO", progress: 100, fileCount: 4, taskCount: 3, status: "completed" as const },
];

type FilterType = "all" | "active" | "paused" | "completed";

export default function ProjectsPage() {
  const t = useTranslations();
  const [filter, setFilter] = useState<FilterType>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = filter === "all" ? mockProjects : mockProjects.filter((p) => p.status === filter);

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: t("Projects.all") },
    { key: "active", label: t("Projects.active") },
    { key: "paused", label: t("Projects.paused") },
    { key: "completed", label: t("Projects.completed") },
  ];

  return (
    <DashboardLayout activeRoute="/proyectos" locale="es" t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header + New button */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">{t("Projects.title")}</h1>
            <p className="text-sm text-tertiary mt-1">{t("Projects.subtitle")}</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-accent-indigo text-white text-sm font-medium rounded-md hover:bg-accent-indigo/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t("Home.newProject")}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 border-b border-app">
          {tabs.map((tab) => {
            const count = tab.key === "all" ? mockProjects.length : mockProjects.filter((p) => p.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab.key ? "border-accent-indigo text-accent-indigo" : "border-transparent text-tertiary hover:text-secondary"
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

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => {
              const slug = project.name.toLowerCase().replace(/\s+/g, "-");
              return (
                <a key={project.name} href={`/es/proyectos/${slug}`}>
                  <ProjectCard {...project} t={t} />
                </a>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-tertiary">{t("Projects.noProjects")}</p>
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 text-sm text-accent-indigo hover:underline"
            >
              Crear el primer proyecto
            </button>
          </div>
        )}
      </div>

      <NewProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        locale="es"
        t={t}
      />
    </DashboardLayout>
  );
}
