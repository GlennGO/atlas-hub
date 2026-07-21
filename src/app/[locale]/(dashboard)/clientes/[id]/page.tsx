"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Building2, Mail, Phone, FileText, FolderKanban, ArrowLeft, Loader2, Save, Check } from "lucide-react";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  color: string;
  description: string | null;
}

export default function ClientDetailPage({ params: routeParams }: { params: Promise<{ id: string }> }) {
  const t = useTranslations();
  const urlParams = useParams();
  const locale = (urlParams?.locale as string) || "es";
  const [clientId, setClientId] = useState("");
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    params.then(p => setClientId(p.id));
  }, [params]);

  useEffect(() => {
    if (!clientId) return;
    loadClient();
  }, [clientId]);

  async function loadClient() {
    try {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) return;
      const data = await res.json();
      setClient(data.client);
      setProjects(data.projects || []);
      setEditName(data.client?.name || "");
      setEditEmail(data.client?.contact_email || "");
      setEditPhone(data.client?.contact_phone || "");
      setEditNotes(data.client?.notes || "");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!client) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          contact_email: editEmail,
          contact_phone: editPhone,
          notes: editNotes,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout activeRoute="/clientes" locale={locale} t={t}>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-tertiary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout activeRoute="/clientes" locale={locale} t={t}>
        <div className="max-w-3xl mx-auto text-center py-20">
          <p className="text-sm text-tertiary">Cliente no encontrado</p>
          <a href="/es/clientes" className="text-sm text-accent-indigo hover:underline mt-2 inline-block">
            ← Volver a clientes
          </a>
        </div>
      </DashboardLayout>
    );
  }

  const statusColors: Record<string, string> = {
    active: "bg-success/10 text-success",
    paused: "bg-warning/10 text-warning",
    completed: "bg-accent-indigo/10 text-accent-indigo",
    archived: "bg-hover text-tertiary",
  };

  return (
    <DashboardLayout activeRoute="/clientes" locale={locale} t={t}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back */}
        <a href="/es/clientes" className="inline-flex items-center gap-1.5 text-sm text-tertiary hover:text-primary transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Clientes
        </a>

        {/* Client header */}
        <div className="bg-card border border-app rounded-xl p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-indigo/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-accent-indigo" />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full bg-app border border-app rounded-lg px-3 py-1.5 text-lg font-bold text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50"
                />
              ) : (
                <h1 className="text-xl font-bold text-primary">{client.name}</h1>
              )}
              <div className="flex flex-wrap gap-4 mt-2">
                {editing ? (
                  <>
                    <input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="Email"
                      className="bg-app border border-app rounded-md px-2 py-1 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50" />
                    <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="Teléfono"
                      className="bg-app border border-app rounded-md px-2 py-1 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50" />
                  </>
                ) : (
                  <>
                    {client.contact_email && (
                      <span className="flex items-center gap-1.5 text-xs text-tertiary">
                        <Mail className="w-3 h-3" /> {client.contact_email}
                      </span>
                    )}
                    {client.contact_phone && (
                      <span className="flex items-center gap-1.5 text-xs text-tertiary">
                        <Phone className="w-3 h-3" /> {client.contact_phone}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-md text-xs text-tertiary hover:bg-hover transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent-indigo text-white text-xs font-medium hover:bg-accent-indigo/90 disabled:opacity-40">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Guardar
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="px-3 py-1.5 rounded-md text-xs text-secondary hover:bg-hover transition-colors">
                  Editar
                </button>
              )}
              {saved && (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Check className="w-3.5 h-3.5" /> Guardado
                </span>
              )}
            </div>
          </div>
          {editing ? (
            <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notas..." rows={2}
              className="w-full mt-3 bg-app border border-app rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50 resize-none" />
          ) : (
            client.notes && <p className="text-sm text-secondary mt-3">{client.notes}</p>
          )}
        </div>

        {/* Projects */}
        <div>
          <h2 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-accent-indigo" />
            Proyectos ({projects.length})
          </h2>
          {projects.length === 0 ? (
            <div className="bg-card border border-app rounded-xl p-6 text-center">
              <p className="text-sm text-tertiary">Sin proyectos asociados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map(p => (
                <a
                  key={p.id}
                  href={`/es/proyectos/${p.id}`}
                  className="flex items-center gap-3 bg-card border border-app rounded-lg p-3 hover:border-accent-indigo/50 transition-colors"
                >
                  <div className="w-2 h-8 rounded-full" style={{ background: p.color || "#4f46e5" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{p.name}</p>
                    {p.description && <p className="text-xs text-tertiary truncate">{p.description}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[p.status] || statusColors.active}`}>
                    {p.status}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
