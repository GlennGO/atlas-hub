"use client";

import { FileText, Image, Video, CheckSquare, MessageSquare, Bot } from "lucide-react";

interface ActivityEvent {
  id: string;
  type: "generated" | "completedTask" | "uploadedFile" | "sentMessage";
  actor: string;
  detail: string;
  timestamp: string;
}

const iconMap = {
  generated: { icon: Bot, color: "text-accent-indigo" },
  completedTask: { icon: CheckSquare, color: "text-success" },
  uploadedFile: { icon: FileText, color: "text-warning" },
  sentMessage: { icon: MessageSquare, color: "text-accent-coral" },
};

// Placeholder data — will be replaced by Supabase Realtime
const mockEvents: ActivityEvent[] = [
  {
    id: "1",
    type: "generated",
    actor: "Hermes",
    detail: "3 documentos de ventas (REPLai Pilot)",
    timestamp: "2h",
  },
  {
    id: "2",
    type: "completedTask",
    actor: "Hermes",
    detail: "Investigación de competidores completada",
    timestamp: "4h",
  },
  {
    id: "3",
    type: "uploadedFile",
    actor: "Hermes",
    detail: "Atlas_Command_Center_Plan.md",
    timestamp: "6h",
  },
  {
    id: "4",
    type: "sentMessage",
    actor: "Hermes",
    detail: "Propuesta enviada a Atlas Hub plan",
    timestamp: "1d",
  },
];

interface ActivityFeedProps {
  t: (key: string) => string;
}

export function ActivityFeed({ t }: ActivityFeedProps) {
  return (
    <div className="bg-card border border-app rounded-xl p-5">
      <h3 className="font-semibold text-primary text-sm mb-4 flex items-center justify-between">
        {t("Home.recentActivity")}
        <button className="text-xs text-tertiary hover:text-accent-indigo transition-colors">
          {t("Home.viewAll")}
        </button>
      </h3>

      <div className="space-y-1">
        {mockEvents.map((event, index) => {
          const { icon: Icon, color } = iconMap[event.type];
          return (
            <div
              key={event.id}
              className="flex items-start gap-3 py-2.5 px-2 rounded-md hover:bg-hover transition-colors animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`mt-0.5 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary">
                  <span className="font-medium">{event.actor}</span>{" "}
                  <span className="text-secondary">
                    {t(`ActivityFeed.${event.type}`)}
                  </span>
                </p>
                <p className="text-xs text-tertiary truncate">{event.detail}</p>
              </div>
              <span className="text-xs text-tertiary whitespace-nowrap">
                {t("ActivityFeed.ago")} {event.timestamp}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
