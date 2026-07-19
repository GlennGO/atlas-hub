"use client";

import { useState } from "react";
import { Send, Bot } from "lucide-react";

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

  const handleSend = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Date.now().toString(),
      direction: "outbound",
      content: input,
      timestamp: "now",
    };
    setMessages([...messages, msg]);
    setInput("");
    // In production: POST /api/agent/run -> Hermes processes -> webhook callback -> Realtime update
  };

  return (
    <div className="bg-card border border-app rounded-xl flex flex-col h-full min-h-[300px]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-app">
        <div className="w-7 h-7 rounded-full bg-accent-indigo/10 flex items-center justify-center">
          <Bot className="w-4 h-4 text-accent-indigo" />
        </div>
        <span className="font-medium text-primary text-sm">
          {t("Home.chatWithAgent")}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-8 h-8 text-tertiary mb-2" />
            <p className="text-sm text-tertiary">
              {t("Home.chatWithAgent")}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  msg.direction === "outbound"
                    ? "bg-accent-indigo text-white"
                    : "bg-hover text-primary"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-app">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="..."
            className="flex-1 bg-app border border-app rounded-md px-3 py-2 text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-indigo/50"
          />
          <button
            onClick={handleSend}
            className="p-2 rounded-md bg-accent-indigo text-white hover:bg-accent-indigo/90 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
