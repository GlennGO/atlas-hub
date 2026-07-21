"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FolderKanban, FileText, CheckSquare, TrendingUp } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";

export const dynamic = "force-dynamic";

/* ---------- Types matching the API response shapes ---------- */

interface Project {
  id: string;
  name: string;
  color: string | null;
  status: string;
  fileCount: number;
  taskCount: number;
  completedTasks: number;
}

interface Task {
  id: string;
  status: string;
  title: string;
}

interface FileItem {
  id: string;
  created_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface ActivityEvent {
  id: string;
  created_at: string;
  type: string;
}

/* ---------- Constants ---------- */

const DAY_LABELS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAY_LABELS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Fallback colors for the distribution donut
const DONUT_COLORS = [
  "#4f46e5",
  "#FC7C5B",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

export default function MetricsPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || "es";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);

  /* ---------- Fetch all data on mount ---------- */

  useEffect(() => {
    async function load() {
      try {
        const [projRes, taskRes, fileRes, clientRes, actRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/tasks"),
          fetch("/api/files"),
          fetch("/api/clients"),
          fetch("/api/activity?limit=200"),
        ]);

        const [projData, taskData, fileData, clientData, actData] = await Promise.all([
          projRes.json(),
          taskRes.json(),
          fileRes.json(),
          clientRes.json(),
          actRes.json(),
        ]);

        if (projData.projects) setProjects(projData.projects);
        if (taskData.tasks) setTasks(taskData.tasks);
        if (fileData.files) setFiles(fileData.files);
        if (clientData.clients) setClients(clientData.clients);
        if (actData.activity) setActivity(actData.activity);
      } catch (err) {
        console.error("Error loading metrics:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ---------- Real computed metrics ---------- */

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((tk) => tk.status === "done").length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalFiles = files.length;
  const totalClients = clients.length;

  const stats = [
    {
      key: "totalProjects",
      value: String(totalProjects),
      icon: FolderKanban,
      color: "text-accent-indigo",
      bg: "bg-accent-indigo/10",
    },
    {
      key: "totalFiles",
      value: String(totalFiles),
      icon: FileText,
      color: "text-accent-coral",
      bg: "bg-accent-coral/10",
    },
    {
      key: "totalTasks",
      value: String(completedTasks),
      icon: CheckSquare,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      key: "completionRate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  /* ---------- Weekly activity — events per day (last 7 days) ---------- */

  const dayLabels = locale === "en" ? DAY_LABELS_EN : DAY_LABELS_ES;
  const now = new Date();
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const count = activity.filter((a) => {
      const d = new Date(a.created_at);
      return d >= dayStart && d <= dayEnd;
    }).length;
    return { label: dayLabels[date.getDay()], value: count };
  });
  const hasWeekData = weekData.some((d) => d.value > 0);
  const maxBar = Math.max(...weekData.map((d) => d.value), 1);

  /* ---------- Distribution by project (tasks) ---------- */

  const totalTasksForDist = projects.reduce(
    (acc, p) => acc + (p.taskCount || 0),
    0
  );
  const distribution = projects
    .filter((p) => (p.taskCount || 0) > 0)
    .slice(0, 6)
    .map((p, i) => ({
      label: p.name,
      count: p.taskCount || 0,
      value:
        totalTasksForDist > 0
          ? Math.round(((p.taskCount || 0) / totalTasksForDist) * 100)
          : 0,
      color: p.color || DONUT_COLORS[i % DONUT_COLORS.length],
    }));
  const hasDistribution = distribution.length > 0;

  /* ---------- Files over time — last 30 days ---------- */

  const filesOverTime = Array.from({ length: 30 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (29 - i));
    const dayStr = date.toDateString();
    return files.filter((f) => new Date(f.created_at).toDateString() === dayStr)
      .length;
  });
  const hasFilesOverTime = filesOverTime.some((c) => c > 0);
  const maxFilesDay = Math.max(...filesOverTime, 1);

  /* ---------- Donut SVG geometry ---------- */

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  /* ---------- Loading skeleton ---------- */

  if (loading) {
    return (
      <DashboardLayout activeRoute="/metricas" locale={locale} t={t}>
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <div className="h-6 bg-hover rounded w-32 animate-pulse mb-2" />
            <div className="h-4 bg-hover rounded w-64 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card border border-app rounded-xl p-4 h-24 animate-pulse"
              >
                <div className="h-9 w-9 bg-hover rounded-lg mb-3" />
                <div className="h-6 bg-hover rounded w-1/2 mb-2" />
                <div className="h-3 bg-hover rounded w-2/3" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-card border border-app rounded-xl p-5 h-64 animate-pulse" />
            <div className="bg-card border border-app rounded-xl p-5 h-64 animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ---------- Error state ---------- */

  if (error) {
    return (
      <DashboardLayout activeRoute="/metricas" locale={locale} t={t}>
        <div className="max-w-7xl mx-auto">
          <div className="bg-card border border-app rounded-xl p-12 text-center">
            <TrendingUp className="w-10 h-10 text-tertiary mx-auto mb-3" />
            <p className="text-sm text-tertiary">{t("Metrics.loadError")}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  /* ---------- Main render ---------- */

  return (
    <DashboardLayout activeRoute="/metricas" locale={locale} t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-primary">
            {t("Metrics.title")}
          </h1>
          <p className="text-sm text-tertiary mt-1">
            {totalProjects} {t("Metrics.totalProjects").toLowerCase()} ·{" "}
            {totalClients} {t("Clients.title").toLowerCase()} · {totalTasks}{" "}
            {t("Nav.tasks").toLowerCase()}
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.key}
                className="bg-card border border-app rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-tertiary mt-1">
                  {t(`Metrics.${stat.key}`)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart — activity per day (last 7 days) */}
          <div className="lg:col-span-2 bg-card border border-app rounded-xl p-5">
            <h3 className="text-sm font-semibold text-primary mb-4">
              {t("Metrics.tasksPerWeek")}
            </h3>
            {hasWeekData ? (
              <div className="flex items-end gap-3 h-40 px-2">
                {weekData.map((d, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <span className="text-xs text-secondary font-medium">
                      {d.value}
                    </span>
                    <div
                      className="w-full flex items-end"
                      style={{ height: "100px" }}
                    >
                      <div
                        className="w-full bg-accent-indigo rounded-t-md transition-all hover:bg-accent-indigo/80 cursor-pointer"
                        style={{
                          height: `${(d.value / maxBar) * 100}%`,
                          minHeight: d.value > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <span className="text-xs text-tertiary">{d.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-center">
                <p className="text-sm text-tertiary">
                  {t("Metrics.noActivityWeek")}
                </p>
              </div>
            )}
          </div>

          {/* Donut chart — distribution by project */}
          <div className="bg-card border border-app rounded-xl p-5">
            <h3 className="text-sm font-semibold text-primary mb-4">
              {t("Metrics.projectDistribution")}
            </h3>
            {hasDistribution ? (
              <div className="flex flex-col items-center">
                <div className="relative">
                  <svg
                    width="160"
                    height="160"
                    viewBox="0 0 160 160"
                    className="-rotate-90"
                  >
                    {distribution.map((item, i) => {
                      const dash = (item.value / 100) * circumference;
                      const offset = (cumulativePercent / 100) * circumference;
                      cumulativePercent += item.value;
                      return (
                        <circle
                          key={i}
                          cx="80"
                          cy="80"
                          r={radius}
                          fill="none"
                          stroke={item.color}
                          strokeWidth="16"
                          strokeDasharray={`${dash} ${circumference - dash}`}
                          strokeDashoffset={-offset}
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {totalTasksForDist}
                    </span>
                    <span className="text-[10px] text-tertiary">
                      {t("Tasks.done")}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5 mt-3 w-full">
                  {distribution.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-secondary truncate">
                          {item.label}
                        </span>
                      </div>
                      <span className="text-tertiary font-medium shrink-0 ml-2">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-40 text-center">
                <p className="text-sm text-tertiary">
                  {t("Metrics.noDistribution")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Files over time — sparkline (last 30 days) */}
        <div className="bg-card border border-app rounded-xl p-5">
          <h3 className="text-sm font-semibold text-primary mb-4">
            {t("Metrics.filesOverTime")}
          </h3>
          {hasFilesOverTime ? (
            <>
              <div className="flex items-end gap-1 h-24">
                {filesOverTime.map((count, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-accent-indigo/20 rounded-sm hover:bg-accent-indigo/40 transition-colors cursor-pointer min-w-[3px]"
                    style={{
                      height: `${(count / maxFilesDay) * 100}%`,
                      minHeight: count > 0 ? "4px" : "1px",
                    }}
                    title={`${count} ${t("Files.title").toLowerCase()}`}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-tertiary">
                <span>{t("Metrics.lastWeek")}</span>
                <span>{t("Metrics.thisWeek")}</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-24 text-center">
              <p className="text-sm text-tertiary">{t("Metrics.noFiles")}</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
