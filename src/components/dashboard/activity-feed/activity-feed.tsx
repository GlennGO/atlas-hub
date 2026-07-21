"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  CheckSquare,
  MessageSquare,
  Bot,
  Plus,
  FolderKanban,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";

/* ---------- Types ---------- */

interface ActivityEvent {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  actor: string | null;
  created_at: string;
}

interface ActivityFeedProps {
  t: (key: string) => string;
}

/* ---------- Event type → icon / color / i18n label ---------- */

interface EventConfig {
  icon: LucideIcon;
  color: string;
  labelKey: string;
}

const eventTypeConfig: Record<string, EventConfig> = {
  task_created: { icon: Plus, color: "text-accent-indigo", labelKey: "taskCreated" },
  task_completed: { icon: CheckSquare, color: "text-success", labelKey: "completedTask" },
  project_created: { icon: FolderKanban, color: "text-accent-indigo", labelKey: "projectCreated" },
  file_uploaded: { icon: FileText, color: "text-warning", labelKey: "uploadedFile" },
  file_generated: { icon: Bot, color: "text-accent-indigo", labelKey: "generated" },
  message_sent: { icon: MessageSquare, color: "text-accent-coral", labelKey: "sentMessage" },
  agent_message: { icon: MessageSquare, color: "text-accent-coral", labelKey: "sentMessage" },
};

const defaultConfig: EventConfig = {
  icon: Bot,
  color: "text-accent-indigo",
  labelKey: "generated",
};

/* ---------- Helpers ---------- */

/** Extract a human-readable detail string from the event payload. */
function getEventDetail(event: ActivityEvent): string {
  const payload = event.payload;
  if (!payload) return event.type.replace(/_/g, " ");

  if (typeof payload.title === "string") return payload.title;
  if (typeof payload.name === "string") return payload.name;
  if (typeof payload.fileName === "string") return payload.fileName;
  if (typeof payload.filename === "string") return payload.filename;
  if (typeof payload.message === "string") {
    return payload.message.length > 60
      ? payload.message.slice(0, 60) + "…"
      : payload.message;
  }
  if (typeof payload.description === "string") {
    return payload.description.length > 60
      ? payload.description.slice(0, 60) + "…"
      : payload.description;
  }
  return event.type.replace(/_/g, " ");
}

/** Format the actor field into a display name. */
function formatActor(actor: string | null): string {
  if (!actor) return "Sistema";
  if (actor.startsWith("user:")) {
    const name = actor.slice(5);
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  if (actor.startsWith("agent:") || actor.startsWith("bot:")) return "Hermes";
  return actor.charAt(0).toUpperCase() + actor.slice(1);
}

/** Format an ISO date into a short relative-time string. */
function formatRelativeTime(isoDate: string): string {
  const diffMin = Math.floor(
    (Date.now() - new Date(isoDate).getTime()) / 60000
  );
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  return new Date(isoDate).toLocaleDateString();
}

/* ---------- Component ---------- */

export function ActivityFeed({ t }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/activity?limit=10");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          if (Array.isArray(data.activity)) {
            setEvents(data.activity);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        console.error("Error loading activity:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-card border border-app rounded-xl p-5">
      <h3 className="font-semibold text-primary text-sm mb-4 flex items-center justify-between">
        {t("Home.recentActivity")}
        <button className="text-xs text-tertiary hover:text-accent-indigo transition-colors">
          {t("Home.viewAll")}
        </button>
      </h3>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 py-2.5">
              <div className="w-4 h-4 bg-hover rounded animate-pulse mt-0.5 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-hover rounded w-3/4 animate-pulse" />
                <div className="h-2.5 bg-hover rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="w-8 h-8 text-tertiary mb-2" />
          <p className="text-sm text-tertiary">{t("ActivityFeed.loadError")}</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <MessageSquare className="w-8 h-8 text-tertiary mb-2" />
          <p className="text-sm text-tertiary">{t("ActivityFeed.noActivity")}</p>
        </div>
      )}

      {/* Events list */}
      {!loading && !error && events.length > 0 && (
        <div className="space-y-1">
          {events.map((event, index) => {
            const config = eventTypeConfig[event.type] || defaultConfig;
            const Icon = config.icon;
            return (
              <div
                key={event.id}
                className="flex items-start gap-3 py-2.5 px-2 rounded-md hover:bg-hover transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`mt-0.5 ${config.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary">
                    <span className="font-medium">
                      {formatActor(event.actor)}
                    </span>{" "}
                    <span className="text-secondary">
                      {t(`ActivityFeed.${config.labelKey}`)}
                    </span>
                  </p>
                  <p className="text-xs text-tertiary truncate">
                    {getEventDetail(event)}
                  </p>
                </div>
                <span className="text-xs text-tertiary whitespace-nowrap shrink-0">
                  {formatRelativeTime(event.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
