/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        vexor: {
          bg: "var(--vexor-bg)",
          card: "var(--vexor-card)",
          "card-hover": "var(--vexor-card-hover)",
          border: "var(--vexor-border)",
          "border-hover": "var(--vexor-border-hover)",
          text: "var(--vexor-text)",
          muted: "var(--vexor-muted)",
          accent: "var(--vexor-accent)",
          "accent-dim": "var(--vexor-accent-dim)"
        },
        critical: "var(--critical)",
        high: "var(--high)",
        medium: "var(--medium)",
        low: "var(--low)"
      },
      boxShadow: {
        vexor: "0 0 20px rgba(255, 255, 255, 0.05)"
      },
      backgroundImage: {
        "vexor-gradient": "linear-gradient(135deg, #ffffff, #eeeeee)"
      }
    }
  },
  plugins: []
};
