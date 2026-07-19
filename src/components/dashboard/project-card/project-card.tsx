"use client";

import { FolderKanban, FileText, CheckSquare } from "lucide-react";

interface ProjectCardProps {
  name: string;
  client?: string;
  progress: number;
  fileCount: number;
  taskCount: number;
  status: "active" | "paused" | "completed";
  t: (key: string) => string;
}

export function ProjectCard({
  name,
  client,
  progress,
  fileCount,
  taskCount,
  status,
  t,
}: ProjectCardProps) {
  const statusColors = {
    active: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    completed: "bg-accent-indigo/10 text-accent-indigo",
  };

  return (
    <div className="bg-card border border-app rounded-xl p-5 card-glow transition-all cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-primary text-base">{name}</h3>
          {client && (
            <p className="text-sm text-tertiary mt-0.5">{client}</p>
          )}
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
        >
          {t(`ProjectCard.${status}`)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-tertiary">{t("ProjectCard.progress")}</span>
          <span className="text-xs font-medium text-secondary">{progress}%</span>
        </div>
        <div className="h-1.5 bg-hover rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-indigo rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-xs text-tertiary">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          <span>{fileCount} {t("ProjectCard.files")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckSquare className="w-3.5 h-3.5" />
          <span>{taskCount} {t("ProjectCard.tasks")}</span>
        </div>
      </div>
    </div>
  );
}
