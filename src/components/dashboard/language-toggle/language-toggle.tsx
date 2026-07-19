"use client";

import { useState } from "react";
import { Globe } from "lucide-react";

interface LanguageToggleProps {
  locale: string;
  onToggle: (locale: string) => void;
}

export function LanguageToggle({ locale, onToggle }: LanguageToggleProps) {
  const [current, setCurrent] = useState(locale);

  const toggle = () => {
    const next = current === "es" ? "en" : "es";
    setCurrent(next);
    onToggle(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-hover text-secondary hover:text-primary transition-colors text-sm font-medium"
      aria-label="Toggle language"
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase">{current}</span>
    </button>
  );
}
