import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#050810",
          1: "#080c17",
          2: "#0d1220",
          3: "#131926",
          4: "#1a2235",
        },
        rim: {
          DEFAULT: "#1e2a3d",
          2: "#253348",
        },
        cyan: {
          agent: "#00e5cc",
          bright: "#00ffd5",
          dim: "#0099aa",
        },
        gold: { agent: "#f0b429" },
        rose: { agent: "#ff5c7a" },
        lime: { agent: "#39e079" },
        text: {
          1: "#e8eef8",
          2: "#8a97b0",
          3: "#4a5570",
          4: "#2e3b55",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        body: ["var(--font-body)", "sans-serif"],
      },
      animation: {
        "blink-dot": "blink-dot 2s infinite",
        "cursor": "cursor 1s step-end infinite",
        "fade-up": "fade-up 0.5s ease both",
        "scale-in": "scale-in 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        "pulse-border": "pulse-border 1.5s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "spin-slow": "spin 3s linear infinite",
        "float-1": "float-1 20s ease-in-out infinite",
        "float-2": "float-2 25s ease-in-out infinite",
        "float-3": "float-3 18s ease-in-out infinite",
        "float-4": "float-4 22s ease-in-out infinite",
        "morph": "morph 15s ease-in-out infinite",
      },
      keyframes: {
        "blink-dot": {
          "0%,100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(0,229,204,.5)" },
          "50%": { opacity: "0.6", boxShadow: "0 0 0 5px rgba(0,229,204,0)" },
        },
        "cursor": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.88)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "pulse-border": {
          "0%,100%": { borderColor: "rgba(0,229,204,.2)" },
          "50%": { borderColor: "rgba(0,229,204,.8)", boxShadow: "0 0 16px rgba(0,229,204,.2)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        "float-1": {
          "0%,100%": { transform: "translate(0, 0) rotate(0deg)" },
          "33%": { transform: "translate(30px, -50px) rotate(120deg)" },
          "66%": { transform: "translate(-20px, 20px) rotate(240deg)" },
        },
        "float-2": {
          "0%,100%": { transform: "translate(0, 0) scale(1)" },
          "50%": { transform: "translate(-40px, -30px) scale(1.1)" },
        },
        "float-3": {
          "0%,100%": { transform: "translate(0, 0) rotate(0deg)" },
          "25%": { transform: "translate(20px, 40px) rotate(90deg)" },
          "50%": { transform: "translate(-30px, 20px) rotate(180deg)" },
          "75%": { transform: "translate(10px, -20px) rotate(270deg)" },
        },
        "float-4": {
          "0%,100%": { transform: "translate(0, 0) scale(1) rotate(0deg)" },
          "33%": { transform: "translate(-50px, 30px) scale(0.9) rotate(60deg)" },
          "66%": { transform: "translate(20px, -40px) scale(1.05) rotate(-60deg)" },
        },
        "morph": {
          "0%,100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" },
          "25%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" },
          "50%": { borderRadius: "50% 60% 30% 60% / 30% 60% 70% 40%" },
          "75%": { borderRadius: "60% 40% 60% 30% / 70% 30% 50% 60%" },
        },
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(0,229,204,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,204,.04) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "60px 60px",
      },
    },
  },
  plugins: [],
};

export default config;
