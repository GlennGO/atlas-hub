"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  Search, Filter, Plus, X, Star, Phone, MessageCircle,
  Globe, Mail, MapPin, ChevronDown, TrendingUp,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────
interface Prospect {
  id: string;
  company_name: string;
  tier: string;
  stage: string;
  city: string;
  state: string;
  region: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  facebook: string;
  address: string;
  icp_score: number;
  has_whatsapp: boolean;
  has_website: boolean;
  has_facebook: boolean;
  is_franchise: boolean;
  is_multi_state: boolean;
  is_industrial: boolean;
  notes: string;
  source: string;
  contact_date: string | null;
  next_action: string;
  created_at: string;
}

const STAGES = [
  { id: "identificado", label: "Identificado", color: "bg-slate-500" },
  { id: "contactado", label: "Contactado", color: "bg-blue-500" },
  { id: "respondio", label: "Respondio", color: "bg-cyan-500" },
  { id: "demo_agendada", label: "Demo Agendada", color: "bg-purple-500" },
  { id: "demo_completada", label: "Demo Completada", color: "bg-indigo-500" },
  { id: "propuesta_enviada", label: "Propuesta Enviada", color: "bg-amber-500" },
  { id: "cerrado_ganado", label: "Cerrado Ganado", color: "bg-green-500" },
  { id: "follow_up", label: "Follow Up", color: "bg-orange-500" },
];

const TIERS = [
  { id: "S", label: "S - Franquicias", color: "bg-gradient-to-r from-purple-600 to-pink-600" },
  { id: "A", label: "A - WhatsApp+Web", color: "bg-gradient-to-r from-blue-600 to-cyan-600" },
  { id: "B", label: "B - Establecidas", color: "bg-gradient-to-r from-green-600 to-teal-600" },
  { id: "C", label: "C - Toluca", color: "bg-gradient-to-r from-amber-600 to-orange-600" },
  { id: "D", label: "D - Extras", color: "bg-gradient-to-r from-slate-500 to-slate-600" },
];

const REGIONS = ["Todas", "CDMX + EdoMex", "Norte", "Bajio", "Centro", "Sureste", "Nacional"];

// ─── Prospect Card (draggable) ──────────────────────────
function ProspectCard({
  prospect,
  onClick,
}: {
  prospect: Prospect;
  onClick?: () => void;
}) {
  const tierColors: Record<string, string> = {
    S: "border-l-purple-500",
    A: "border-l-blue-500",
    B: "border-l-green-500",
    C: "border-l-amber-500",
    D: "border-l-slate-500",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-app rounded-lg border border-app border-l-4 ${tierColors[prospect.tier] || "border-l-slate-500"} p-3 cursor-pointer hover:shadow-md transition-shadow group`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-semibold text-sm text-primary line-clamp-2 flex-1">
          {prospect.company_name}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <span className="text-xs font-bold text-accent-indigo bg-accent-indigo/10 px-1.5 py-0.5 rounded">
            {prospect.icp_score}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-secondary mb-2">
        {prospect.city && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {prospect.city}
          </span>
        )}
        {prospect.is_franchise && (
          <span className="bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded font-medium">
            Franquicia
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {prospect.has_whatsapp && (
          <span className="flex items-center gap-1 text-green-500" title="WhatsApp">
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        )}
        {prospect.has_website && (
          <span className="flex items-center gap-1 text-blue-500" title="Sitio web">
            <Globe className="w-3.5 h-3.5" />
          </span>
        )}
        {prospect.phone && (
          <span className="flex items-center gap-1 text-cyan-500" title="Telefono">
            <Phone className="w-3.5 h-3.5" />
          </span>
        )}
        {prospect.email && (
          <span className="flex items-center gap-1 text-amber-500" title="Email">
            <Mail className="w-3.5 h-3.5" />
          </span>
        )}
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
          prospect.tier === "S" ? "bg-purple-500/15 text-purple-400" :
          prospect.tier === "A" ? "bg-blue-500/15 text-blue-400" :
          prospect.tier === "B" ? "bg-green-500/15 text-green-400" :
          "bg-slate-500/15 text-slate-400"
        }`}>
          TIER {prospect.tier}
        </span>
      </div>
    </div>
  );
}

// ─── Column (stage) ─────────────────────────────────────
function StageColumn({
  stage,
  prospects,
  onCardClick,
}: {
  stage: { id: string; label: string; color: string };
  prospects: Prospect[];
  onCardClick: (p: Prospect) => void;
}) {
  return (
    <div className="flex flex-col min-w-[260px] w-[260px] bg-app/50 rounded-xl border border-app">
      <div className="flex items-center justify-between px-3 py-2 border-b border-app">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.color}`} />
          <span className="font-medium text-sm text-primary">{stage.label}</span>
        </div>
        <span className="text-xs text-secondary bg-hover px-2 py-0.5 rounded-full">
          {prospects.length}
        </span>
      </div>
      <SortableContext items={prospects.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[200px]">
          {prospects.map((p) => (
            <ProspectCard key={p.id} prospect={p} onClick={() => onCardClick(p)} />
          ))}
          {prospects.length === 0 && (
            <div className="text-center text-xs text-tertiary py-8">
              Sin prospectos
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Detail Modal ───────────────────────────────────────
function ProspectModal({
  prospect,
  onClose,
  onUpdate,
}: {
  prospect: Prospect | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Prospect>) => void;
}) {
  const [notes, setNotes] = useState(prospect?.notes || "");
  const [nextAction, setNextAction] = useState(prospect?.next_action || "");
  const [stage, setStage] = useState(prospect?.stage || "identificado");

  useEffect(() => {
    setNotes(prospect?.notes || "");
    setNextAction(prospect?.next_action || "");
    setStage(prospect?.stage || "identificado");
  }, [prospect]);

  if (!prospect) return null;

  const handleSave = () => {
    onUpdate(prospect.id, { notes, next_action: nextAction, stage });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-app rounded-xl border border-app max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-app">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                prospect.tier === "S" ? "bg-purple-500/15 text-purple-400" :
                prospect.tier === "A" ? "bg-blue-500/15 text-blue-400" :
                prospect.tier === "B" ? "bg-green-500/15 text-green-400" :
                "bg-slate-500/15 text-slate-400"
              }`}>
                TIER {prospect.tier}
              </span>
              <span className="text-xs text-secondary">ICP Score: {prospect.icp_score}</span>
            </div>
            <h2 className="text-lg font-bold text-primary">{prospect.company_name}</h2>
            <p className="text-sm text-secondary">
              {prospect.city}{prospect.state ? `, ${prospect.state}` : ""}
              {prospect.region ? ` (${prospect.region})` : ""}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-hover">
            <X className="w-5 h-5 text-secondary" />
          </button>
        </div>

        {/* Contact info */}
        <div className="p-5 space-y-3 border-b border-app">
          {prospect.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className="text-sm text-primary">{prospect.phone}</span>
            </div>
          )}
          {prospect.whatsapp && (
            <div className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4 text-green-500 shrink-0" />
              <a
                href={prospect.whatsapp.startsWith("wa.me") ? `https://${prospect.whatsapp}` : `https://wa.me/${prospect.whatsapp.replace(/\D/g, "")}`}
                target="_blank" rel="noopener"
                className="text-sm text-green-500 hover:underline"
              >
                {prospect.whatsapp}
              </a>
            </div>
          )}
          {prospect.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-amber-500 shrink-0" />
              <a href={`mailto:${prospect.email}`} className="text-sm text-amber-500 hover:underline">
                {prospect.email}
              </a>
            </div>
          )}
          {prospect.website && (
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-blue-500 shrink-0" />
              <a href={prospect.website.startsWith("http") ? prospect.website : `https://${prospect.website}`} target="_blank" rel="noopener" className="text-sm text-blue-500 hover:underline">
                {prospect.website}
              </a>
            </div>
          )}
          {prospect.facebook && (
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-blue-600 shrink-0" />
              <a href={prospect.facebook.startsWith("http") ? prospect.facebook : `https://${prospect.facebook}`} target="_blank" rel="noopener" className="text-sm text-blue-400 hover:underline">
                Facebook
              </a>
            </div>
          )}
          {prospect.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
              <span className="text-sm text-secondary">{prospect.address}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-app">
          {prospect.is_franchise && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-1 rounded">Franquicia</span>}
          {prospect.is_multi_state && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-1 rounded">Multi-estado</span>}
          {prospect.is_industrial && <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-1 rounded">Industrial/B2B</span>}
          {prospect.has_whatsapp && <span className="text-xs bg-green-500/15 text-green-400 px-2 py-1 rounded">WhatsApp</span>}
          {prospect.has_website && <span className="text-xs bg-cyan-500/15 text-cyan-400 px-2 py-1 rounded">Sitio web</span>}
        </div>

        {/* Editable fields */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">Etapa del pipeline</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full bg-hover text-primary text-sm rounded-md px-3 py-2 border border-app focus:outline-none focus:ring-1 focus:ring-accent-indigo"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">Notas</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Agregar notas de contacto, observaciones..."
              className="w-full bg-hover text-primary text-sm rounded-md px-3 py-2 border border-app focus:outline-none focus:ring-1 focus:ring-accent-indigo resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-secondary mb-1 block">Proxima accion</label>
            <input
              type="text"
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              placeholder="Ej: Llamar el lunes, enviar propuesta..."
              className="w-full bg-hover text-primary text-sm rounded-md px-3 py-2 border border-app focus:outline-none focus:ring-1 focus:ring-accent-indigo"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full bg-accent-indigo text-white text-sm font-medium py-2 rounded-md hover:bg-accent-indigo/90 transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stats Bar ──────────────────────────────────────────
function StatsBar({ prospects }: { prospects: Prospect[] }) {
  const total = prospects.length;
  const contacted = prospects.filter((p) => p.stage !== "identificado").length;
  const demos = prospects.filter((p) => ["demo_agendada", "demo_completada"].includes(p.stage)).length;
  const won = prospects.filter((p) => p.stage === "cerrado_ganado").length;
  const withWa = prospects.filter((p) => p.has_whatsapp).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
      <div className="bg-app rounded-lg border border-app p-3">
        <div className="text-2xl font-bold text-primary">{total}</div>
        <div className="text-xs text-secondary">Total prospectos</div>
      </div>
      <div className="bg-app rounded-lg border border-app p-3">
        <div className="text-2xl font-bold text-blue-400">{contacted}</div>
        <div className="text-xs text-secondary">Contactados</div>
      </div>
      <div className="bg-app rounded-lg border border-app p-3">
        <div className="text-2xl font-bold text-purple-400">{demos}</div>
        <div className="text-xs text-secondary">Demos</div>
      </div>
      <div className="bg-app rounded-lg border border-app p-3">
        <div className="text-2xl font-bold text-green-400">{won}</div>
        <div className="text-xs text-secondary">Cerrados ganados</div>
      </div>
      <div className="bg-app rounded-lg border border-app p-3">
        <div className="text-2xl font-bold text-cyan-400">{withWa}</div>
        <div className="text-xs text-secondary">Con WhatsApp</div>
      </div>
    </div>
  );
}

// ─── Main CRM Page ──────────────────────────────────────
export default function CRMPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("ALL");
  const [regionFilter, setRegionFilter] = useState("Todas");
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchProspects = useCallback(async () => {
    try {
      const res = await fetch("/api/crm");
      const data = await res.json();
      setProspects(data.prospects || []);
    } catch (err) {
      console.error("Error fetching prospects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  const handleUpdate = async (id: string, updates: Partial<Prospect>) => {
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
    try {
      await fetch("/api/crm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
    } catch (err) {
      console.error("Error updating prospect:", err);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeProspect = prospects.find((p) => p.id === active.id);
    if (!activeProspect) return;

    // Determine target stage from column id
    const targetStage = over.id as string;
    if (STAGES.some((s) => s.id === targetStage) && activeProspect.stage !== targetStage) {
      handleUpdate(activeProspect.id, { stage: targetStage });
    }
  };

  // Filter prospects
  const filtered = prospects.filter((p) => {
    if (search && !p.company_name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.city || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (tierFilter !== "ALL" && p.tier !== tierFilter) return false;
    if (regionFilter !== "Todas" && p.region !== regionFilter) return false;
    return true;
  });

  const activeProspect = activeId ? prospects.find((p) => p.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-secondary">Cargando CRM...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-app">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-indigo" />
              CRM Pipeline - Fumigacion
            </h1>
            <p className="text-sm text-secondary mt-0.5">
              {filtered.length} prospectos | Pipeline Nacional de REPLai Pilot
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === "kanban" ? "table" : "kanban")}
              className="text-sm text-secondary hover:text-primary px-3 py-1.5 rounded-md hover:bg-hover transition-colors"
            >
              {viewMode === "kanban" ? "Vista Tabla" : "Vista Kanban"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsBar prospects={filtered} />

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresa o ciudad..."
              className="w-full bg-hover text-primary text-sm pl-9 pr-3 py-1.5 rounded-md border border-app focus:outline-none focus:ring-1 focus:ring-accent-indigo"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="bg-hover text-primary text-sm rounded-md px-3 py-1.5 border border-app focus:outline-none focus:ring-1 focus:ring-accent-indigo"
          >
            <option value="ALL">Todos los Tiers</option>
            {TIERS.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-hover text-primary text-sm rounded-md px-3 py-1.5 border border-app focus:outline-none focus:ring-1 focus:ring-accent-indigo"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" ? (
        <div className="flex-1 overflow-x-auto p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-3 h-full">
              {STAGES.map((stage) => {
                const stageProspects = filtered.filter((p) => p.stage === stage.id);
                return (
                  <div key={stage.id} id={stage.id} className="flex-shrink-0">
                    <StageColumn
                      stage={stage}
                      prospects={stageProspects}
                      onCardClick={(p) => setSelectedProspect(p)}
                    />
                  </div>
                );
              })}
            </div>
            <DragOverlay>
              {activeProspect ? (
                <div className="opacity-80 rotate-2">
                  <ProspectCard prospect={activeProspect} />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      ) : (
        /* Table View */
        <div className="flex-1 overflow-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-secondary border-b border-app">
                <th className="px-3 py-2 font-medium">Empresa</th>
                <th className="px-3 py-2 font-medium">Tier</th>
                <th className="px-3 py-2 font-medium">Ciudad</th>
                <th className="px-3 py-2 font-medium">Etapa</th>
                <th className="px-3 py-2 font-medium">Score</th>
                <th className="px-3 py-2 font-medium">WhatsApp</th>
                <th className="px-3 py-2 font-medium">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setSelectedProspect(p)}
                  className="border-b border-app/50 cursor-pointer hover:bg-hover transition-colors"
                >
                  <td className="px-3 py-2 text-primary font-medium">{p.company_name}</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      p.tier === "S" ? "bg-purple-500/15 text-purple-400" :
                      p.tier === "A" ? "bg-blue-500/15 text-blue-400" :
                      p.tier === "B" ? "bg-green-500/15 text-green-400" :
                      "bg-slate-500/15 text-slate-400"
                    }`}>{p.tier}</span>
                  </td>
                  <td className="px-3 py-2 text-secondary">{p.city || "-"}</td>
                  <td className="px-3 py-2 text-secondary">{STAGES.find(s => s.id === p.stage)?.label || p.stage}</td>
                  <td className="px-3 py-2"><span className="text-accent-indigo font-bold">{p.icp_score}</span></td>
                  <td className="px-3 py-2">{p.has_whatsapp ? <MessageCircle className="w-4 h-4 text-green-500" /> : "-"}</td>
                  <td className="px-3 py-2 text-secondary text-xs">{p.phone || p.email || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <ProspectModal
        prospect={selectedProspect}
        onClose={() => setSelectedProspect(null)}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
