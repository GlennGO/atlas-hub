"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useState } from "react";
import { FileText, Image as ImageIcon, Code, Download } from "lucide-react";

export const dynamic = "force-dynamic";

type FileType = "document" | "image" | "code";

interface MockFile {
  name: string;
  type: FileType;
  size: string;
  modified: string;
  project: string;
}

const mockFiles: MockFile[] = [
  { name: "Propuesta_Ventas_REPLai.pdf", type: "document", size: "2.4 MB", modified: "hace 2h", project: "REPLai Pilot" },
  { name: "Atlas_Command_Center.md", type: "document", size: "45 KB", modified: "hace 6h", project: "Atlas Hub" },
  { name: "diseno_landing_v2.png", type: "image", size: "1.8 MB", modified: "hace 1d", project: "REPLai Pilot" },
  { name: "schema_supabase.sql", type: "code", size: "12 KB", modified: "hace 1d", project: "Atlas Hub" },
  { name: "logo_glenngo.svg", type: "image", size: "8 KB", modified: "hace 2d", project: "GlennGO" },
  { name: "workflow_n8n.json", type: "code", size: "34 KB", modified: "hace 2d", project: "REPLai Pilot" },
  { name: "estrategia_etsy.pdf", type: "document", size: "1.2 MB", modified: "hace 3d", project: "Etsy Digital Products" },
  { name: "dashboard_mockup.png", type: "image", size: "3.1 MB", modified: "hace 3d", project: "Atlas Hub" },
  { name: "api_evolution.ts", type: "code", size: "18 KB", modified: "hace 4d", project: "REPLai Pilot" },
];

const typeConfig: Record<FileType, { icon: typeof FileText; color: string; bg: string }> = {
  document: { icon: FileText, color: "text-warning", bg: "bg-warning/10" },
  image: { icon: ImageIcon, color: "text-accent-coral", bg: "bg-accent-coral/10" },
  code: { icon: Code, color: "text-accent-indigo", bg: "bg-accent-indigo/10" },
};

type FilterType = "all" | FileType;

export default function FilesPage() {
  const t = useTranslations();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = filter === "all" ? mockFiles : mockFiles.filter((f) => f.type === filter);

  const tabs: { key: FilterType; label: string }[] = [
    { key: "all", label: t("Files.all") },
    { key: "document", label: t("Files.documents") },
    { key: "image", label: t("Files.images") },
    { key: "code", label: t("Files.code") },
  ];

  return (
    <DashboardLayout activeRoute="/archivos" locale="es" t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-primary">{t("Files.title")}</h1>
          <p className="text-sm text-tertiary mt-1">{t("Files.subtitle")}</p>
        </div>

        <div className="flex items-center gap-1 border-b border-app">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                filter === tab.key ? "border-accent-indigo text-accent-indigo" : "border-transparent text-tertiary hover:text-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((file, index) => {
              const { icon: Icon, color, bg } = typeConfig[file.type];
              return (
                <div
                  key={file.name}
                  className="bg-card border border-app rounded-xl p-4 card-glow transition-all animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{file.name}</p>
                      <p className="text-xs text-tertiary mt-0.5">{file.project}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-tertiary">
                        <span>{file.size}</span>
                        <span>·</span>
                        <span>{file.modified}</span>
                      </div>
                    </div>
                    <button className="p-1.5 rounded-md text-tertiary hover:text-primary hover:bg-hover transition-colors flex-shrink-0">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm text-tertiary">{t("Files.noFiles")}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
