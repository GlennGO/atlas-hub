"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FilePreviewModal, FilePreviewData } from "@/components/dashboard/file-preview-modal/file-preview-modal";
import {
  ArrowLeft,
  FileText,
  CheckSquare,
  Clock,
  MoreVertical,
  Pencil,
  Plus,
  Upload,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface RealFile {
  id: string;
  name: string;
  type: "document" | "image" | "video" | "audio" | "other";
  mime_type: string | null;
  storage_path: string;
  size_bytes: number;
  created_at: string;
  previewUrl: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "review" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
}

interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  color: string | null;
  created_at: string;
}

const statusConfig: Record<Task["status"], { label: string; color: string }> = {
  todo: { label: "Por hacer", color: "text-tertiary bg-hover" },
  in_progress: { label: "En progreso", color: "text-warning bg-warning/10" },
  done: { label: "Completada", color: "text-success bg-success/10" },
  review: { label: "Revisión", color: "text-accent-indigo bg-accent-indigo/10" },
  blocked: { label: "Bloqueada", color: "text-error bg-error/10" },
};

const priorityConfig: Record<Task["priority"], { label: string; color: string }> = {
  low: { label: "Baja", color: "text-tertiary" },
  medium: { label: "Media", color: "text-secondary" },
  high: { label: "Alta", color: "text-warning" },
  urgent: { label: "Urgente", color: "text-error" },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `hace ${mins}min`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

export default function ProjectDetailPage() {
  const t = useTranslations();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [files, setFiles] = useState<RealFile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<FilePreviewData | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/projects?id=${projectId}`);
        const data = await res.json();
        if (data.project) {
          setProject(data.project);
          setFiles(data.files || []);
          setTasks(data.tasks || []);
        }
      } catch (err) {
        console.error("Error loading project:", err);
      } finally {
        setLoading(false);
      }
    }
    if (projectId) load();
  }, [projectId]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, title: newTaskTitle.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => [data.task, ...prev]);
        setNewTaskTitle("");
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleToggleTask(task: Task) {
    const newStatus = task.status === "done" ? "todo" : "done";
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? data.task : t)));
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUploadFile(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        // Recargar archivos del proyecto
        const projRes = await fetch(`/api/projects?id=${projectId}`);
        const projData = await projRes.json();
        if (projData.files) setFiles(projData.files);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout activeRoute="/proyectos" locale="es" t={t}>
        <div className="max-w-7xl mx-auto py-20 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-tertiary/30 border-t-accent-indigo rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout activeRoute="/proyectos" locale="es" t={t}>
        <div className="max-w-7xl mx-auto py-20 text-center">
          <p className="text-sm text-tertiary">Proyecto no encontrado</p>
          <a href="/es/proyectos" className="mt-3 inline-block text-sm text-accent-indigo hover:underline">
            ← Volver a proyectos
          </a>
        </div>
      </DashboardLayout>
    );
  }

  const completedTasks = tasks.filter((task) => task.status === "done").length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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
            Proyectos
          </a>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color || "#4f46e5" }}
                />
                <h1 className="text-xl font-bold text-primary">{project.name}</h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                  {project.status === "active" ? "Activo" : project.status}
                </span>
              </div>
              <p className="text-sm text-tertiary">
                Creado {timeAgo(project.created_at)}
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

          {project.description && (
            <p className="text-sm text-secondary leading-relaxed max-w-3xl">
              {project.description}
            </p>
          )}

          {/* Progress */}
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-tertiary">Progreso</span>
                <span className="text-xs font-medium text-secondary">{progress}%</span>
              </div>
              <div className="h-1.5 bg-hover rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: project.color || "#4f46e5" }}
                />
              </div>
            </div>
            <div className="text-xs text-tertiary">
              {completedTasks}/{totalTasks} tareas · {files.length} archivos
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
                Archivos ({files.length})
              </h2>
              <label className="text-xs text-accent-indigo hover:underline cursor-pointer flex items-center gap-1">
                {uploading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-accent-indigo/30 border-t-accent-indigo rounded-full animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3" />
                    Subir
                  </>
                )}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <div className="space-y-2">
              {files.length > 0 ? (
                files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() =>
                      setPreviewFile({
                        name: file.name,
                        type: file.type,
                        url: file.previewUrl || undefined,
                        mimeType: file.mime_type || undefined,
                        size: formatSize(file.size_bytes),
                        createdAt: timeAgo(file.created_at),
                      })
                    }
                    className="w-full flex items-center gap-3 p-3 bg-card border border-app rounded-lg hover:border-accent-indigo/30 transition-colors cursor-pointer group text-left"
                  >
                    <div className="w-8 h-8 rounded-md bg-hover flex items-center justify-center">
                      <FileText className="w-4 h-4 text-tertiary group-hover:text-accent-indigo transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate group-hover:text-accent-indigo transition-colors">
                        {file.name}
                      </p>
                      <p className="text-xs text-tertiary">
                        {formatSize(file.size_bytes)} · {timeAgo(file.created_at)}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-sm text-tertiary">
                  No hay archivos. Subí el primero.
                </div>
              )}
            </div>
          </section>

          {/* Tasks */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-primary flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Tareas ({totalTasks})
            </h2>

            {/* Quick add */}
            <form onSubmit={handleCreateTask} className="flex items-center gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nueva tarea..."
                className="flex-1 bg-app border border-app rounded-md px-3 py-1.5 text-sm text-primary placeholder:text-tertiary outline-none focus:border-accent-indigo"
              />
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="p-1.5 rounded-md bg-accent-indigo text-white hover:bg-accent-indigo/90 disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-2">
              {tasks.length > 0 ? (
                tasks.map((task) => {
                  const sc = statusConfig[task.status];
                  const pc = priorityConfig[task.priority];
                  return (
                    <button
                      key={task.id}
                      onClick={() => handleToggleTask(task)}
                      className="w-full flex items-center gap-3 p-3 bg-card border border-app rounded-lg hover:border-accent-indigo/30 transition-colors text-left"
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                          task.status === "done"
                            ? "bg-success border-success"
                            : "border-tertiary hover:border-accent-indigo"
                        }`}
                      >
                        {task.status === "done" && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
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
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-sm text-tertiary">
                  No hay tareas. Creá la primera.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <FilePreviewModal
        file={previewFile}
        open={previewFile !== null}
        onClose={() => setPreviewFile(null)}
      />
    </DashboardLayout>
  );
}
