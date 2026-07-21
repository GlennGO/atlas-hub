"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface AgentChatProps {
  t: (key: string) => string;
}

interface Message {
  id: string;
  direction: "outbound" | "inbound";
  content: string;
  timestamp: string;
}

export function AgentChat({ t }: AgentChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Cargar historial al montar
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/agent/history");
        if (!res.ok) {
          if (res.status === 401) {
            setError("Necesitas iniciar sesión");
            return;
          }
          throw new Error("Error al cargar historial");
        }
        const data = await res.json();
        if (data.messages?.length) {
          setMessages(
            data.messages.map((m: Record<string, string>) => ({
              id: m.id,
              direction: m.direction,
              content: m.content,
              timestamp: m.created_at,
            }))
          );
        }
      } catch {
        // Silencioso — empezar con chat vacío
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, []);

  // Auto-scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      direction: "outbound",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Enviar historial reciente para contexto
      const history = messages.slice(-10).map((m) => ({
        direction: m.direction,
        content: m.content,
      }));

      const res = await fetch("/api/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }

      const data = await res.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        direction: "inbound",
        content: data.content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error desconocido";
      setError(errMsg);
      // Mostrar error como mensaje del agente
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          direction: "inbound",
          content: `⚠️ ${errMsg}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-app rounded-xl flex flex-col h-full max-h-[600px] min-h-[400px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-app">
        <div className="w-7 h-7 rounded-full bg-accent-indigo/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-accent-indigo" />
        </div>
        <span className="font-medium text-primary text-sm">
          Hermes — VP de Operaciones
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-tertiary">En línea</span>
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 text-tertiary animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Bot className="w-10 h-10 text-accent-indigo/30 mb-3" />
            <p className="text-sm text-tertiary mb-1">
              Hablá con Hermes
            </p>
            <p className="text-xs text-tertiary/70">
              Preguntá sobre proyectos, clientes, tareas o cualquier cosa de GlennGO
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${
                  msg.direction === "outbound" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.direction === "inbound" && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-indigo/10 flex items-center justify-center mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-accent-indigo" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    msg.direction === "outbound"
                      ? "bg-accent-indigo text-white rounded-br-sm"
                      : "bg-hover text-primary rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.direction === "outbound" && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-coral/10 flex items-center justify-center mt-0.5">
                    <User className="w-3.5 h-3.5 text-accent-coral" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-accent-indigo/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-accent-indigo" />
                </div>
                <div className="bg-hover rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-tertiary/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-tertiary/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-tertiary/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-app">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Escribí tu mensaje..."
            disabled={loading}
            className="flex-1 bg-app border border-app rounded-lg px-3.5 py-2.5 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-lg bg-accent-indigo text-white hover:bg-accent-indigo/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Enviar"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
