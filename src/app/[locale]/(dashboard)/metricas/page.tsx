"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FolderKanban, FileText, CheckSquare, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

// Stat cards data
const stats = [
  { key: "totalProjects", value: "6", icon: FolderKanban, color: "text-accent-indigo", bg: "bg-accent-indigo/10", change: "+2" },
  { key: "totalFiles", value: "59", icon: FileText, color: "text-accent-coral", bg: "bg-accent-coral/10", change: "+12" },
  { key: "totalTasks", value: "24", icon: CheckSquare, color: "text-success", bg: "bg-success/10", change: "+5" },
  { key: "completionRate", value: "68%", icon: TrendingUp, color: "text-warning", bg: "bg-warning/10", change: "+8%" },
];

// Bar chart data — tareas completadas por día
const weekData = [
  { label: "Lun", value: 4 },
  { label: "Mar", value: 7 },
  { label: "Mié", value: 5 },
  { label: "Jue", value: 9 },
  { label: "Vie", value: 6 },
  { label: "Sáb", value: 3 },
  { label: "Dom", value: 2 },
];

// Donut chart data — distribución por proyecto
const distribution = [
  { label: "REPLai Pilot", value: 45, color: "#4f46e5" },
  { label: "Atlas Hub", value: 25, color: "#FC7C5B" },
  { label: "Etsy Products", value: 20, color: "#10B981" },
  { label: "Otros", value: 10, color: "#F59E0B" },
];

export default function MetricsPage() {
  const t = useTranslations();
  const maxBar = Math.max(...weekData.map((d) => d.value));

  // Cálculos del donut SVG
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  return (
    <DashboardLayout activeRoute="/metricas" locale="es" t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-primary">{t("Metrics.title")}</h1>
          <p className="text-sm text-tertiary mt-1">{t("Metrics.subtitle")}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.key} className="bg-card border border-app rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <span className="text-xs font-medium text-success">{stat.change}</span>
                </div>
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-tertiary mt-1">{t(`Metrics.${stat.key}`)}</p>
              </div>
            );
          })}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart — tareas por semana */}
          <div className="lg:col-span-2 bg-card border border-app rounded-xl p-5">
            <h3 className="text-sm font-semibold text-primary mb-4">{t("Metrics.tasksPerWeek")}</h3>
            <div className="flex items-end gap-3 h-40 px-2">
              {weekData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-secondary font-medium">{d.value}</span>
                  <div className="w-full flex items-end" style={{ height: "100px" }}>
                    <div
                      className="w-full bg-accent-indigo rounded-t-md transition-all hover:bg-accent-indigo/80 cursor-pointer"
                      style={{ height: `${(d.value / maxBar) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-tertiary">{d.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut chart — distribución por proyecto */}
          <div className="bg-card border border-app rounded-xl p-5">
            <h3 className="text-sm font-semibold text-primary mb-4">{t("Metrics.projectDistribution")}</h3>
            <div className="flex flex-col items-center">
              <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
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
                <text x="80" y="75" textAnchor="middle" className="rotate-90 fill-current text-primary" fontSize="22" fontWeight="700" style={{ transformOrigin: "center" }}>
                  100%
                </text>
              </svg>
              <div className="space-y-1.5 mt-3 w-full">
                {distribution.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-secondary">{item.label}</span>
                    </div>
                    <span className="text-tertiary font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Files over time — mini sparkline row */}
        <div className="bg-card border border-app rounded-xl p-5">
          <h3 className="text-sm font-semibold text-primary mb-4">{t("Metrics.filesOverTime")}</h3>
          <div className="flex items-end gap-1 h-24">
            {Array.from({ length: 30 }, (_, i) => {
              // Datos determinísticos con tendencia creciente
              const heights = [20, 35, 25, 45, 30, 50, 40, 55, 65, 45, 60, 70, 55, 75, 65, 80, 70, 85, 75, 90, 80, 95, 85, 100, 90, 100, 95, 100, 85, 95];
              return (
                <div
                  key={i}
                  className="flex-1 bg-accent-indigo/20 rounded-sm hover:bg-accent-indigo/40 transition-colors cursor-pointer min-w-[3px]"
                  style={{ height: `${heights[i]}%` }}
                  title={`Día ${i + 1}`}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-tertiary">
            <span>Hace 30 días</span>
            <span>Hoy</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
