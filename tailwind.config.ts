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
        surface: {
          DEFAULT: "#0f131d",
          dim: "#0f131d",
          bright: "#353944",
          "container-lowest": "#0a0e18",
          "container-low": "#171b26",
          container: "#1c1f2a",
          "container-high": "#262a35",
          "container-highest": "#313540",
        },
        "on-surface": {
          DEFAULT: "#dfe2f1",
          variant: "#c2c6d6",
        },
        "inverse-surface": "#dfe2f1",
        "inverse-on-surface": "#2c303b",
        outline: {
          DEFAULT: "#8c909f",
          variant: "#424754",
        },
        "surface-tint": "#adc6ff",
        primary: {
          DEFAULT: "#3B82F6",
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3B82F6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        "on-primary": "#ffffff",
        "primary-container": "#4d8eff",
        "on-primary-container": "#00285d",
        secondary: {
          DEFAULT: "#d0bcff",
        },
        "on-secondary": "#3c0091",
        "secondary-container": "#571bc1",
        "on-secondary-container": "#c4abff",
        tertiary: {
          DEFAULT: "#2fd9f4",
        },
        "on-tertiary": "#00363e",
        "tertiary-container": "#009fb4",
        "on-tertiary-container": "#002f36",
        error: {
          DEFAULT: "#ffb4ab",
        },
        "on-error": "#690005",
        "error-container": "#93000a",
        "on-error-container": "#ffdad6",
        background: "#0f131d",
        "on-background": "#dfe2f1",
        "surface-variant": "#313540",
      },
      spacing: {
        unit: "8px",
        "container-padding": "24px",
        gutter: "16px",
        "sidebar-width": "260px",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
      fontFamily: {
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["jetbrainsMono", "monospace"],
      },
      fontSize: {
        display: ["48px", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "600" }],
        h1: ["32px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "600" }],
        "h1-mobile": ["24px", { lineHeight: "1.2", letterSpacing: "-0.02em", fontWeight: "600" }],
        h2: ["24px", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "1.4", letterSpacing: "-0.01em", fontWeight: "500" }],
        "body-lg": ["16px", { lineHeight: "1.6", letterSpacing: "-0.01em", fontWeight: "400" }],
        "body-md": ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
        "label-md": ["12px", { lineHeight: "1", letterSpacing: "0.02em", fontWeight: "500" }],
        mono: ["13px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
      },
      backdropBlur: {
        glass: "12px",
      },
      boxShadow: {
        glow: "0 0 20px rgba(59, 130, 246, 0.15)",
        "glow-violet": "0 0 8px rgba(208, 188, 255, 0.3)",
        "glow-cyan": "0 0 8px rgba(47, 217, 244, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
