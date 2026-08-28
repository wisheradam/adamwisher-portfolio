import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        background: "#050505",
        foreground: "#F4F4F5",
        muted: {
          DEFAULT: "rgba(255,255,255,0.035)",
          foreground: "#A1A1AA",
        },
        border: "rgba(255,255,255,0.10)",
        surface: "rgba(255,255,255,0.035)",
        accent: {
          DEFAULT: "#3B82F6",
          foreground: "#F4F4F5",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "10px",
        sm: "8px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s ease forwards",
        blink: "blink 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
