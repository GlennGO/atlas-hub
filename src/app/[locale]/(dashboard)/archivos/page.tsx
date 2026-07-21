"use client";

import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { FilePreviewModal, FilePreviewData } from "@/components/dashboard/file-preview-modal/file-preview-modal";
import { useState, useEffect, useRef } from "react";
import { FileText, Image as ImageIcon, Video, Music, File as FileIcon, Download, Upload, X } from "lucide-react";
import { useParams } from "next/navigation";

export const dynamic = "force-dynamic";

type FileType = "document" | "image" | "video" | "audio" | "other";

interface RealFile {
  id: string;
  name: string;
  type: FileType;
  mime_type: string | null;
  storage_path: string;
  size_bytes: number;
  created_at: string;
  previewUrl: string | null;
}

const typeIcons: Record<FileType, typeof FileText> = {
  document: FileText,
  image: ImageIcon,
  video: Video,
  audio: Music,
  other: FileIcon,
};

const typeColors: Record<FileType, string> = {
  document: "text-warning",
  image: "text-accent-coral",
  video: "text-accent-indigo",
  audio: "text-success",
  other: "text-tertiary",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 60) return `hace ${mins} min`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

export default function FilesPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = (params?.locale as string) || "es";
  const [filter, setFilter] = useState<"all" | FileType>("all");
  const [files, setFiles] = useState<RealFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<FilePreviewData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar archivos reales de Supabase via API
  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await fetch("/api/files");
        const data = await res.json();
        if (data.files) {
          setFiles(data.files);
        }
      } catch (err) {
        console.error("Error loading files:", err);
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, []);

  // Upload handler
  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        // Recargar lista
        const listRes = await fetch("/api/files");
        const listData = await listRes.json();
        if (listData.files) setFiles(listData.files);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error al subir el archivo");
    } finally {
      setUploading(false);
    }
  }

  const filtered = filter === "all" ? files : files.filter((f) => f.type === filter);

  const tabs: { key: "all" | FileType; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "document", label: "Documentos" },
    { key: "image", label: "Imágenes" },
    { key: "video", label: "Video" },
    { key: "audio", label: "Audio" },
  ];

  return (
    <DashboardLayout activeRoute="/archivos" locale={locale} t={t}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header + upload button */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary">Archivos</h1>
            <p className="text-sm text-tertiary mt-1">
              {files.length > 0
                ? `${files.length} archivos · ${formatSize(files.reduce((acc, f) => acc + f.size_bytes, 0))} en total`
                : "Galería de archivos"}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = ""; // reset para poder subir el mismo archivo otra vez
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 bg-accent-indigo text-white text-sm font-medium rounded-md hover:bg-accent-indigo/90 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Subir archivo
              </>
            )}
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1 border-b border-app overflow-x-auto">
          {tabs.map((tab) => {
            const count = tab.key === "all" ? files.length : files.filter((f) => f.type === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  filter === tab.key
                    ? "border-accent-indigo text-accent-indigo"
                    : "border-transparent text-tertiary hover:text-secondary"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className="text-[10px] text-tertiary bg-hover px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Grid de archivos */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-tertiary/30 border-t-accent-indigo rounded-full animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((file, index) => {
              const Icon = typeIcons[file.type];
              const color = typeColors[file.type];
              return (
                <button
                  key={file.id}
                  onClick={() =>
                    setPreviewFile({
                      name: file.name,
                      type: file.type,
                      url: file.previewUrl || undefined,
                      mimeType: file.mime_type || undefined,
                      size: formatSize(file.size_bytes),
                      createdAt: timeAgo(file.created_at),
                    })
                  }
                  className="bg-card border border-app rounded-xl p-4 card-glow transition-all animate-fade-in text-left hover:border-accent-indigo/30 cursor-pointer group"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-hover flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-5 h-5 ${color} group-hover:text-accent-indigo transition-colors`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate group-hover:text-accent-indigo transition-colors">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-tertiary">
                        <span>{formatSize(file.size_bytes)}</span>
                        <span>·</span>
                        <span>{timeAgo(file.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {/* Preview thumbnail para imágenes */}
                  {file.type === "image" && file.previewUrl && (
                    <div className="mt-3 aspect-video bg-hover rounded-md overflow-hidden">
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileIcon className="w-12 h-12 text-tertiary mb-3" />
            <p className="text-sm text-tertiary mb-1">No hay archivos todavía</p>
            <p className="text-xs text-tertiary mb-4">
              Sube tu primer archivo con el botón de arriba
            </p>
          </div>
        )}
      </div>

      <FilePreviewModal
        file={previewFile}
        open={previewFile !== null}
        onClose={() => setPreviewFile(null)}
      />
    </DashboardLayout>
  );
}
