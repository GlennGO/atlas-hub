"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Plus, X, ChevronLeft, ChevronRight, AlertCircle, Loader2, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

// Internal column keys (camelCase, matching translation keys)
type TaskStatus = "todo" | "inProgress" | "done";
type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  project_id: string | null;
  project_name?: string | null;
  status: string; // raw value from API (todo | in_progress | inProgress | done | ...)
  priority: string; // raw value from API
  assignee?: string | null;
  assigned_to?: string | null;
  description?: string | null;
}

interface Project {
  id: string;
  name: string;
  color?: string | null;
}

// ──────────────────────────────────────────────
// Status mapping — DB uses snake_case `in_progress`
// (CHECK constraint), but internal columns use
// camelCase to match translation keys. Normalize
// on read and convert on write.
// ──────────────────────────────────────────────

const STATUS_TO_COLUMN: Record<string, TaskStatus> = {
  todo: "todo",
  in_progress: "inProgress",
  inprogress: "inProgress",
  inProgress: "inProgress",
  done: "done",
};

const COLUMN_TO_DB_STATUS: Record<TaskStatus, string> = {
  todo: "todo",
  inProgress: "in_progress",
  done: "done",
};

const COLUMN_ORDER: TaskStatus[] = ["todo", "inProgress", "done"];

const priorityColors: Record<string, string> = {
  high: "bg-error/10 text-error",
  urgent: "bg-error/10 text-error",
  medium: "bg-warning/10 text-warning",
  low: "bg-accent-indigo/10 text-accent-indigo",
};

function priorityLabel(p: string): Priority {
  const v = String(p || "").toLowerCase();
  if (v === "high" || v === "urgent") return "high";
  if (v === "low") return "low";
  return "medium";
}

function columnOf(task: Task): TaskStatus {
  return STATUS_TO_COLUMN[String(task.status || "").toLowerCase()] ?? "todo";
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export default function TasksPage() {
  const t = useTranslations();
  const params = useParams();
  const locale =
    (params && (params.locale as string)) || "es";

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");

  // Per-task updating state (id -> bool) to show spinner on cards being moved
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // ── Data fetching ───────────────────────────
  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTasks(Array.isArray(data.tasks) ? data.tasks : []);
      setError(null);
    } catch (err) {
      console.error("Error loading tasks:", err);
      setError("No se pudieron cargar las tareas. Revisa tu conexión e inténtalo de nuevo.");
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setProjects(Array.isArray(data.projects) ? data.projects : []);
    } catch (err) {
      // Non-fatal — project dropdown will just be empty
      console.error("Error loading projects:", err);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await Promise.all([loadTasks(), loadProjects()]);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [loadTasks, loadProjects]);

  // ── Project name lookup ─────────────────────
  const projectNameFor = useCallback(
    (task: Task): string => {
      if (task.project_name) return task.project_name;
      if (!task.project_id) return "Sin proyecto";
      const p = projects.find((pr) => pr.id === task.project_id);
      return p?.name || "Proyecto";
    },
    [projects]
  );

  // ── Group tasks by column ───────────────────
  const grouped: Record<TaskStatus, Task[]> = {
    todo: [],
    inProgress: [],
    done: [],
  };
  for (const task of tasks) {
    grouped[columnOf(task)].push(task);
  }

  // ── Create task ─────────────────────────────
  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) {
      setFormError("El título es obligatorio.");
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          projectId: newProjectId || null,
          priority: newPriority,
          status: "todo",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      // Reset form + close modal + refresh
      setNewTitle("");
      setNewProjectId("");
      setNewPriority("medium");
      setShowModal(false);
      await loadTasks();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "No se pudo crear la tarea."
      );
    } finally {
      setCreating(false);
    }
  }

  // ── Move task between columns ───────────────
  async function moveTask(task: Task, target: TaskStatus) {
    const currentColumn = columnOf(task);
    if (target === currentColumn) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((tk) =>
        tk.id === task.id ? { ...tk, status: COLUMN_TO_DB_STATUS[target] } : tk
      )
    );
    setUpdatingId(task.id);
    try {
      const res = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: task.id,
          status: COLUMN_TO_DB_STATUS[target],
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      // Sync with authoritative server value if returned
      if (data.task) {
        setTasks((prev) =>
          prev.map((tk) => (tk.id === data.task.id ? { ...tk, ...data.task } : tk))
        );
      }
    } catch (err) {
      console.error("Error updating task:", err);
      // Revert on failure
      setTasks((prev) =>
        prev.map((tk) =>
          tk.id === task.id ? { ...tk, status: task.status } : tk
        )
      );
      setError("No se pudo mover la tarea. Inténtalo de nuevo.");
    } finally {
      setUpdatingId(null);
    }
  }

  // ── Render helpers ──────────────────────────
  const totalTasks = tasks.length;

  return (
    <DashboardLayout activeRoute="/tareas" locale={locale} t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-primary">{t("Tasks.title")}</h1>
            <p className="text-sm text-tertiary mt-1">{t("Tasks.subtitle")}</p>
          </div>
          <button
            onClick={() => {
              setFormError(null);
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nueva tarea</span>
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  Promise.all([loadTasks(), loadProjects()]).finally(() =>
                    setLoading(false)
                  );
                }}
                className="underline mt-1 text-xs hover:text-error/80"
              >
                Reintentar
              </button>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-error/70 hover:text-error"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-tertiary">
            <Loader2 size={32} className="animate-spin mb-3" />
            <p className="text-sm">Cargando tareas…</p>
          </div>
        ) : totalTasks === 0 && !error ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-hover flex items-center justify-center mb-4">
              <Inbox size={28} className="text-tertiary" />
            </div>
            <h3 className="text-base font-semibold text-secondary mb-1">
              No hay tareas aún
            </h3>
            <p className="text-sm text-tertiary max-w-sm mb-4">
              Crea tu primera tarea para empezar a organizar tu trabajo en el
              tablero Kanban.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 transition-colors"
            >
              <Plus size={16} />
              Crear tarea
            </button>
          </div>
        ) : (
          /* Kanban board — 3 columnas */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMN_ORDER.map((columnKey) => {
              const columnTasks = grouped[columnKey];
              return (
                <div
                  key={columnKey}
                  className="bg-card border border-app rounded-xl p-4 flex flex-col"
                >
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-secondary">
                      {t(`Tasks.${columnKey}`)}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-hover text-tertiary">
                      {columnTasks.length}
                    </span>
                  </div>

                  {/* Task cards */}
                  <div className="space-y-2 flex-1">
                    {columnTasks.length > 0 ? (
                      columnTasks.map((task, index) => {
                        const colIndex = COLUMN_ORDER.indexOf(columnKey);
                        const canMoveLeft = colIndex > 0;
                        const canMoveRight = colIndex < COLUMN_ORDER.length - 1;
                        const pLabel = priorityLabel(task.priority);
                        const isUpdating = updatingId === task.id;
                        return (
                          <div
                            key={task.id}
                            className="bg-hover border border-app rounded-lg p-3 transition-all animate-fade-in hover:border-accent-indigo/30"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <p className="text-sm font-medium text-primary mb-1">
                              {task.title}
                            </p>
                            <p className="text-xs text-tertiary mb-2">
                              {projectNameFor(task)}
                            </p>
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  priorityColors[pLabel]
                                }`}
                              >
                                {t(`Tasks.${pLabel}`)}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    moveTask(task, COLUMN_ORDER[colIndex - 1])
                                  }
                                  disabled={!canMoveLeft || isUpdating}
                                  className="p-1 rounded text-tertiary hover:text-primary hover:bg-app disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Mover a la izquierda"
                                  title={`Mover a ${t(
                                    `Tasks.${COLUMN_ORDER[colIndex - 1]}`
                                  )}`}
                                >
                                  <ChevronLeft size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    moveTask(task, COLUMN_ORDER[colIndex + 1])
                                  }
                                  disabled={!canMoveRight || isUpdating}
                                  className="p-1 rounded text-tertiary hover:text-primary hover:bg-app disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  aria-label="Mover a la derecha"
                                  title={`Mover a ${t(
                                    `Tasks.${COLUMN_ORDER[colIndex + 1]}`
                                  )}`}
                                >
                                  {isUpdating ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <ChevronRight size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-tertiary text-center py-4">
                        {t("Tasks.noTasks")}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create Task Modal ─────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => !creating && setShowModal(false)}
        >
          <div
            className="w-full max-w-md bg-card border border-app rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between p-4 border-b border-app">
              <h2 className="text-base font-semibold text-primary">
                Nueva tarea
              </h2>
              <button
                onClick={() => !creating && setShowModal(false)}
                className="text-tertiary hover:text-primary transition-colors"
                aria-label="Cerrar"
                disabled={creating}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleCreateTask} className="p-4 space-y-4">
              {formError && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-error/10 border border-error/30 text-error text-xs">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">
                  Título <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej. Diseñar landing page"
                  autoFocus
                  disabled={creating}
                  className="w-full px-3 py-2 rounded-lg bg-app border border-app text-primary text-sm placeholder:text-tertiary focus:outline-none focus:border-accent-indigo/50 disabled:opacity-50"
                />
              </div>

              {/* Project */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">
                  Proyecto
                </label>
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  disabled={creating || projects.length === 0}
                  className="w-full px-3 py-2 rounded-lg bg-app border border-app text-primary text-sm focus:outline-none focus:border-accent-indigo/50 disabled:opacity-50"
                >
                  <option value="">Sin proyecto</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <p className="text-xs text-tertiary mt-1">
                    No hay proyectos disponibles.
                  </p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-secondary mb-1.5">
                  {t("Tasks.priority")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setNewPriority(p)}
                      disabled={creating}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                        newPriority === p
                          ? `${priorityColors[p]} border-current`
                          : "bg-app border-app text-tertiary hover:text-secondary"
                      }`}
                    >
                      {t(`Tasks.${p}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={creating}
                  className="px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-hover transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating || !newTitle.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Creando…
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      Crear
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
