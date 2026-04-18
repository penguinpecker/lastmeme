import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bone: "#f4f0e8",
        ink: "#0a0a08",
        "ink-2": "#12110e",
        hazard: {
          yellow: "#e8d93a",
          lime: "#d4e820",
          amber: "#e8a620",
          red: "#e33e2e",
        },
        signal: {
          blue: "#3aa8e8",
        },
        dim: {
          50: "rgba(244,240,232,0.08)",
          100: "rgba(244,240,232,0.12)",
          200: "rgba(244,240,232,0.2)",
          300: "rgba(244,240,232,0.3)",
          400: "rgba(244,240,232,0.4)",
          500: "rgba(244,240,232,0.55)",
          600: "rgba(244,240,232,0.7)",
        },
      },
      fontFamily: {
        impact: ["var(--font-archivo-black)", "Arial Black", "sans-serif"],
        mono: ["var(--font-vt323)", "VT323", "ui-monospace", "monospace"],
        code: ["var(--font-jetbrains)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      keyframes: {
        blink: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0" } },
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shake: {
          "0%, 3%, 8%, 100%": { transform: "translate(0, 0)" },
          "4%": { transform: "translate(-4px, 2px)" },
          "5%": { transform: "translate(4px, -2px)" },
          "6%": { transform: "translate(-3px, 1px)" },
          "7%": { transform: "translate(2px, -1px)" },
        },
        flash: {
          "0%, 100%, 9%": { opacity: "0" },
          "4%": { opacity: "0.55" },
        },
        shock: {
          "0%": { transform: "translate(-50%, -50%) scale(0)", opacity: "1" },
          "100%": { transform: "translate(-50%, -50%) scale(6)", opacity: "0" },
        },
        "kapow-in": {
          "0%": { transform: "translate(-50%, -50%) scale(0) rotate(-15deg)", opacity: "0" },
          "8%": { transform: "translate(-50%, -50%) scale(1.3) rotate(5deg)", opacity: "1" },
          "25%": { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: "1" },
          "85%": { transform: "translate(-50%, -50%) scale(1) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translate(-50%, -50%) scale(0.9)", opacity: "0.3" },
        },
        "vs-pop": {
          "0%, 3%": { transform: "scale(0)", opacity: "0" },
          "8%": { transform: "scale(1.4)", opacity: "1" },
          "15%, 100%": { transform: "scale(1)", opacity: "1" },
        },
        pulse: { "0%, 100%": { transform: "scale(1)" }, "50%": { transform: "scale(1.06)" } },
        spin: { to: { transform: "rotate(360deg)" } },
        "feed-in": {
          "0%": { opacity: "0", transform: "translateY(-6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        blink: "blink 1s steps(2) infinite",
        scroll: "scroll 50s linear infinite",
        shake: "shake 3s ease-in-out infinite",
        flash: "flash 3s ease-out infinite",
        shock: "shock 3s ease-out infinite",
        kapow: "kapow-in 3s ease-out infinite",
        "vs-pop": "vs-pop 3s ease-out infinite",
        pulse: "pulse 1.6s ease-in-out infinite",
        "spin-slow": "spin 2.4s linear infinite",
        "feed-in": "feed-in 0.3s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
