import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#0a0a0a",
        surface: "#111111",
        border: "#1f1f1f",
        muted: "#737373",
        accent: "#3ecf8e",
        "accent-dim": "#2a9d63",
        ink: "#e5e5e5",
        "ink-dim": "#a3a3a3",
      },
      fontFamily: {
        mono: [
          "var(--font-jetbrains)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      transitionProperty: {
        soft: "color, border-color, background-color, opacity, transform",
      },
    },
  },
  plugins: [],
};

export default config;
