"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProjectCard } from "@/components/dashboard/project-card/project-card";
import { ActivityFeed } from "@/components/dashboard/activity-feed/activity-feed";
import { AgentChat } from "@/components/dashboard/agent-chat";

// Mock data — will be replaced by Supabase queries
const mockProjects = [
  {
    name: "REPLai Pilot",
    client: "FumiPlus Toluca",
    progress: 75,
    fileCount: 12,
    taskCount: 5,
    status: "active" as const,
  },
  {
    name: "Atlas Hub",
    client: "GlennGO",
    progress: 20,
    fileCount: 8,
    taskCount: 3,
    status: "active" as const,
  },
  {
    name: "Etsy Digital Products",
    client: "GlennGO",
    progress: 40,
    fileCount: 15,
    taskCount: 7,
    status: "active" as const,
  },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <DashboardLayout activeRoute="/" locale="es" t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Active Projects */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary">
              {t("Home.activeProjects")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockProjects.map((project) => (
              <ProjectCard key={project.name} {...project} t={t} />
            ))}
          </div>
        </section>

        {/* Bottom grid: Activity Feed + Agent Chat */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ActivityFeed t={t} />

          <AgentChat t={t} />
        </section>
      </div>
    </DashboardLayout>
  );
}
