import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode palette (default)
        background: {
          DEFAULT: "#0A0A0B",
          card: "#131316",
          hover: "#1A1A1F",
          light: "#FAFAFA",
          "light-card": "#FFFFFF",
          "light-hover": "#F4F4F5",
        },
        border: {
          DEFAULT: "#222228",
          light: "#E4E4E7",
        },
        foreground: {
          DEFAULT: "#FAFAFA",
          secondary: "#A1A1AA",
          tertiary: "#71717A",
          light: "#18181B",
          "light-secondary": "#52525B",
          "light-tertiary": "#A1A1AA",
        },
        accent: {
          indigo: "#4f46e5",
          coral: "#FC7C5B",
        },
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      fontSize: {
        base: ["14px", "1.5"],
      },
      animation: {
        "slide-in": "slideIn 0.15s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
      },
      keyframes: {
        slideIn: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
