"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { X, FolderKanban, Palette } from "lucide-react";

interface NewProjectModalProps {
  open: boolean;
  onClose: () => void;
  locale: string;
  t: (key: string) => string;
}

const presetColors = [
  "#4f46e5",
  "#FC7C5B",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#EC4899",
];

export function NewProjectModal({ open, onClose, locale, t }: NewProjectModalProps) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(presetColors[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          client: client.trim() || null,
          description: description.trim() || null,
          color,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Error desconocido");
      }

      // Reset y cerrar
      setName("");
      setClient("");
      setDescription("");
      setColor(presetColors[0]);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear proyecto");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[480px] max-w-[90vw] bg-card border border-app rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-app">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent-indigo/10 flex items-center justify-center">
              <FolderKanban className="w-4 h-4 text-accent-indigo" />
            </div>
            <h2 className="text-sm font-semibold text-primary">Nuevo proyecto</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-hover transition-colors"
          >
            <X className="w-4 h-4 text-tertiary" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Nombre del proyecto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Landing Page Cliente X"
              required
              autoFocus
              className="w-full bg-app border border-app rounded-md px-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none focus:border-accent-indigo transition-colors"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Cliente (opcional)
            </label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Ej. FumiPlus Toluca"
              className="w-full bg-app border border-app rounded-md px-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none focus:border-accent-indigo transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="¿De qué trata este proyecto?"
              rows={3}
              className="w-full bg-app border border-app rounded-md px-3 py-2 text-sm text-primary placeholder:text-tertiary outline-none focus:border-accent-indigo transition-colors resize-none"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-2 flex items-center gap-1.5">
              <Palette className="w-3 h-3" />
              Color del proyecto
            </label>
            <div className="flex items-center gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-all ${
                    color === c ? "ring-2 ring-offset-2 ring-offset-card ring-white/50 scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-xs text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-app">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium text-secondary hover:text-primary transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-4 py-1.5 text-sm font-medium bg-accent-indigo text-white rounded-md hover:bg-accent-indigo/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                "Crear proyecto"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
