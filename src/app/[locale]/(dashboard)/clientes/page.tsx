"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Plus, Building2, Mail, Phone, X, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  project_count: number;
  created_at: string;
}

export default function ClientsPage() {
  const t = useTranslations();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    try {
      const res = await fetch("/api/clients");
      if (!res.ok) return;
      const data = await res.json();
      setClients(data.clients || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact_email: email.trim() || undefined,
          contact_phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setClients([data.client, ...clients]);
        setName(""); setEmail(""); setPhone(""); setNotes("");
        setShowModal(false);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      setClients(clients.filter(c => c.id !== id));
    } catch {
      // silent
    }
  }

  return (
    <DashboardLayout activeRoute="/clientes" locale="es" t={t}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">Clientes</h1>
            <p className="text-sm text-tertiary mt-1">
              {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo cliente
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-tertiary animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-card border border-app rounded-xl p-12 text-center">
            <Building2 className="w-10 h-10 text-tertiary/30 mx-auto mb-3" />
            <p className="text-sm text-tertiary mb-1">No hay clientes todavía</p>
            <p className="text-xs text-tertiary/70">Creá tu primer cliente para asociarle proyectos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-card border border-app rounded-xl p-4 hover:border-accent-indigo/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-indigo/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-accent-indigo" />
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-hover text-secondary">
                    {client.project_count} {client.project_count === 1 ? "proyecto" : "proyectos"}
                  </span>
                </div>
                <a href={`/es/clientes/${client.id}`}>
                  <h3 className="text-sm font-semibold text-primary hover:text-accent-indigo transition-colors">
                    {client.name}
                  </h3>
                </a>
                {client.contact_email && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Mail className="w-3 h-3 text-tertiary" />
                    <span className="text-xs text-tertiary truncate">{client.contact_email}</span>
                  </div>
                )}
                {client.contact_phone && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Phone className="w-3 h-3 text-tertiary" />
                    <span className="text-xs text-tertiary">{client.contact_phone}</span>
                  </div>
                )}
                {client.notes && (
                  <p className="text-xs text-tertiary mt-2 line-clamp-2">{client.notes}</p>
                )}
                <button
                  onClick={() => handleDelete(client.id)}
                  className="text-xs text-error/60 hover:text-error mt-3 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div className="bg-card border border-app rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-primary">Nuevo cliente</h2>
                <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-hover">
                  <X className="w-4 h-4 text-tertiary" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-tertiary mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="FumiPlus"
                    autoFocus
                    className="w-full bg-app border border-app rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-tertiary mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contacto@cliente.com"
                    className="w-full bg-app border border-app rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-tertiary mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full bg-app border border-app rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-tertiary mb-1">Notas</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Servicio contratado, fecha de inicio..."
                    rows={3}
                    className="w-full bg-app border border-app rounded-lg px-3 py-2 text-sm text-primary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50 resize-none"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  disabled={!name.trim() || creating}
                  className="w-full py-2.5 rounded-lg bg-accent-indigo text-white text-sm font-medium hover:bg-accent-indigo/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Crear cliente"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
