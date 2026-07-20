"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ActivityFeed } from "@/components/dashboard/activity-feed/activity-feed";
import { FilePreviewModal, FilePreviewData } from "@/components/dashboard/file-preview-modal/file-preview-modal";
import {
  ArrowLeft,
  FileText,
  CheckSquare,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

export const dynamic = "force-dynamic";

// Mock data — replace with Supabase fetch by id
const project = {
  name: "REPLai Pilot",
  client: "FumiPlus Toluca",
  description:
    "Plataforma de automatización con IA para gestión de leads por WhatsApp. Integración con catálogo de servicios, agendamiento y respuestas automáticas.",
  status: "active" as const,
  progress: 75,
  color: "#4f46e5",
  createdAt: "2026-07-13",
  files: [
    { name: "Proposal-FumiPlus.pdf", type: "document", size: "2.4 MB", createdAt: "2026-07-13" },
    { name: "Architecture-Diagram.png", type: "image", size: "1.1 MB", createdAt: "2026-07-15" },
    { name: "Script-Demo.md", type: "document", size: "12 KB", createdAt: "2026-07-14" },
    { name: "Recording-Demo.mp4", type: "video", size: "85 MB", createdAt: "2026-07-13" },
    { name: "Pricing-Sheet.xlsx", type: "document", size: "48 KB", createdAt: "2026-07-16" },
  ],
  tasks: [
    { title: "Configurar catálogo de servicios", status: "done", priority: "high" },
    { title: "Implementar flujo de agendamiento", status: "in_progress", priority: "high" },
    { title: "Migrar WhatsApp a cuenta de Yonatan", status: "todo", priority: "urgent" },
    { title: "Ajustar precios finales con cliente", status: "todo", priority: "medium" },
    { title: "Documentar caso de éxito", status: "todo", priority: "low" },
  ],
};

const statusConfig = {
  todo: { label: "Por hacer", color: "text-tertiary bg-hover" },
  in_progress: { label: "En progreso", color: "text-warning bg-warning/10" },
  done: { label: "Completada", color: "text-success bg-success/10" },
  review: { label: "Revisión", color: "text-accent-indigo bg-accent-indigo/10" },
  blocked: { label: "Bloqueada", color: "text-error bg-error/10" },
};

const priorityConfig = {
  low: { label: "Baja", color: "text-tertiary" },
  medium: { label: "Media", color: "text-secondary" },
  high: { label: "Alta", color: "text-warning" },
  urgent: { label: "Urgente", color: "text-error" },
};

const fileTypeIcons = {
  document: FileText,
  image: FileText,
  video: FileText,
  audio: FileText,
  other: FileText,
};

export default function ProjectDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const projectId = params.id as string;
  const [previewFile, setPreviewFile] = useState<FilePreviewData | null>(null);

  const completedTasks = project.tasks.filter((task) => task.status === "done").length;
  const totalTasks = project.tasks.length;

  return (
    <DashboardLayout activeRoute="/proyectos" locale="es" t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb + header */}
        <div className="space-y-4">
          <a
            href="/es/proyectos"
            className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("Projects.title")}
          </a>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <h1 className="text-xl font-bold text-primary">{project.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                  {t("ProjectCard.active")}
                </span>
              </div>
              <p className="text-sm text-tertiary">
                {project.client} · Creado {project.createdAt}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-md hover:bg-hover transition-colors">
                <Pencil className="w-4 h-4 text-secondary" />
              </button>
              <button className="p-2 rounded-md hover:bg-hover transition-colors">
                <MoreVertical className="w-4 h-4 text-secondary" />
              </button>
            </div>
          </div>

          <p className="text-sm text-secondary leading-relaxed max-w-3xl">
            {project.description}
          </p>

          {/* Progress */}
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-tertiary">Progreso general</span>
                <span className="text-xs font-medium text-secondary">{project.progress}%</span>
              </div>
              <div className="h-1.5 bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-indigo rounded-full transition-all"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
            <div className="text-xs text-tertiary">
              {completedTasks}/{totalTasks} tareas
            </div>
          </div>
        </div>

        {/* Tabs content: Files + Tasks side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Files */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Archivos ({project.files.length})
              </h2>
              <button className="text-xs text-accent-indigo hover:underline">
                + Subir
              </button>
            </div>
            <div className="space-y-2">
              {project.files.map((file) => {
                const Icon = fileTypeIcons[file.type as keyof typeof fileTypeIcons] || FileText;
                return (
                  <button
                    key={file.name}
                    onClick={() =>
                      setPreviewFile({
                        name: file.name,
                        type: file.type as FilePreviewData["type"],
                        size: file.size,
                        createdAt: file.createdAt,
                        mimeType: file.type === "document" ? "text/markdown" : undefined,
                        url: undefined, // se conectará a Supabase Storage cuando esté listo
                        content: undefined,
                      })
                    }
                    className="w-full flex items-center gap-3 p-3 bg-card border border-app rounded-lg hover:border-accent-indigo/30 transition-colors cursor-pointer group text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-hover flex items-center justify-center">
                      <Icon className="w-4 h-4 text-tertiary group-hover:text-accent-indigo transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate group-hover:text-accent-indigo transition-colors">
                        {file.name}
                      </p>
                      <p className="text-xs text-tertiary">
                        {file.size} · {file.createdAt}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Tasks */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Tareas ({totalTasks})
              </h2>
              <button className="text-xs text-accent-indigo hover:underline">
                + Nueva
              </button>
            </div>
            <div className="space-y-2">
              {project.tasks.map((task) => {
                const sc = statusConfig[task.status as keyof typeof statusConfig];
                const pc = priorityConfig[task.priority as keyof typeof priorityConfig];
                return (
                  <div
                    key={task.title}
                    className="flex items-center gap-3 p-3 bg-card border border-app rounded-lg hover:border-accent-indigo/30 transition-colors"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        task.status === "done"
                          ? "bg-success"
                          : task.status === "in_progress"
                            ? "bg-warning"
                            : "bg-tertiary"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium ${
                          task.status === "done" ? "text-tertiary line-through" : "text-primary"
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className={`text-xs ${pc.color}`}>{pc.label}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                      {sc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Activity feed */}
        <section>
          <h2 className="text-sm font-semibold text-primary flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4" />
            Actividad reciente
          </h2>
          <ActivityFeed t={t} />
        </section>
      </div>

      <FilePreviewModal
        file={previewFile}
        open={previewFile !== null}
        onClose={() => setPreviewFile(null)}
      />
    </DashboardLayout>
  );
}
