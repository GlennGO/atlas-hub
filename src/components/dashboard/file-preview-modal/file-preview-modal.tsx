"use client";

import { useState, useEffect } from "react";
import { X, Download, FileText, Image as ImageIcon, Video, Music, File } from "lucide-react";

export interface FilePreviewData {
  name: string;
  type: "document" | "image" | "video" | "audio" | "other";
  url?: string;       // signed URL for image/video
  content?: string;   // text content for documents (.md, .txt)
  mimeType?: string;
  size?: string;
  createdAt?: string;
}

interface FilePreviewModalProps {
  file: FilePreviewData | null;
  open: boolean;
  onClose: () => void;
}

const fileTypeIcon = {
  document: FileText,
  image: ImageIcon,
  video: Video,
  audio: Music,
  other: File,
};

export function FilePreviewModal({ file, open, onClose }: FilePreviewModalProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !file) return;

    // For markdown/text files, fetch content
    if (file.type === "document" && file.url && file.mimeType?.includes("text")) {
      setLoading(true);
      fetch(file.url)
        .then((r) => r.text())
        .then((text) => setTextContent(text))
        .catch(() => setTextContent("Error al cargar el contenido."))
        .finally(() => setLoading(false));
    } else {
      setTextContent("");
    }
  }, [file, open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !file) return null;

  const Icon = fileTypeIcon[file.type] || File;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal container — click inside doesn't close */}
        <div
          className="bg-card border border-app rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-app">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-md bg-hover flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-accent-indigo" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-primary truncate">{file.name}</p>
                <p className="text-xs text-tertiary">
                  {file.size && `${file.size} · `}
                  {file.type}
                  {file.createdAt && ` · ${file.createdAt}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {file.url && (
                <a
                  href={file.url}
                  download={file.name}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-secondary bg-hover hover:bg-app rounded-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </a>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-hover transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4 text-tertiary" />
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto bg-app">
            {/* IMAGE */}
            {file.type === "image" && file.url && (
              <div className="flex items-center justify-center min-h-[400px] p-6">
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-full max-h-[75vh] object-contain rounded-md"
                />
              </div>
            )}

            {/* VIDEO */}
            {file.type === "video" && file.url && (
              <div className="flex items-center justify-center min-h-[400px] p-6">
                <video
                  src={file.url}
                  controls
                  className="max-w-full max-h-[75vh] rounded-md"
                >
                  Tu navegador no soporta video preview.
                </video>
              </div>
            )}

            {/* AUDIO */}
            {file.type === "audio" && file.url && (
              <div className="flex items-center justify-center min-h-[200px] p-6">
                <audio src={file.url} controls className="w-full max-w-md">
                  Tu navegador no soporta audio preview.
                </audio>
              </div>
            )}

            {/* TEXT / MARKDOWN */}
            {file.type === "document" && (
              <div className="p-6 max-w-3xl mx-auto">
                {loading ? (
                  <div className="flex items-center gap-2 text-sm text-tertiary">
                    <div className="w-3 h-3 border-2 border-tertiary/30 border-t-accent-indigo rounded-full animate-spin" />
                    Cargando contenido...
                  </div>
                ) : textContent ? (
                  <pre className="text-sm text-primary whitespace-pre-wrap font-mono leading-relaxed">
                    {textContent}
                  </pre>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 text-tertiary mx-auto mb-3" />
                    <p className="text-sm text-tertiary mb-1">
                      Vista previa no disponible
                    </p>
                    <p className="text-xs text-tertiary mb-4">
                      Este tipo de documento ({file.mimeType || "desconocido"}) requiere descarga.
                    </p>
                    {file.url && (
                      <a
                        href={file.url}
                        download={file.name}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-accent-indigo text-white rounded-md hover:bg-accent-indigo/90 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar archivo
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* OTHER */}
            {file.type === "other" && (
              <div className="flex flex-col items-center justify-center min-h-[300px] p-6">
                <File className="w-10 h-10 text-tertiary mb-3" />
                <p className="text-sm text-tertiary mb-1">{file.name}</p>
                <p className="text-xs text-tertiary mb-4">
                  Tipo no soportado para preview. Descarga requerida.
                </p>
                {file.url && (
                  <a
                    href={file.url}
                    download={file.name}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-accent-indigo text-white rounded-md hover:bg-accent-indigo/90 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-2 border-t border-app flex items-center justify-between text-[10px] text-tertiary">
            <span>ESC para cerrar</span>
            <span>Atlas Hub · File Preview</span>
          </div>
        </div>
      </div>
    </>
  );
}
