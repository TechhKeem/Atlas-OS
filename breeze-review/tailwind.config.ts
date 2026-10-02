import type { Config } from "tailwindcss";

// Brand tokens mirror the CSS variables in src/app/globals.css.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        breeze: {
          sky: "var(--breeze-sky)",
          cyan: "var(--breeze-cyan)",
          action: "var(--breeze-action)",
          mid: "var(--breeze-mid)",
          deep: "var(--breeze-deep)",
          navy: "var(--breeze-navy)",
          "navy-text": "var(--breeze-navy-text)",
          "footer-top": "var(--breeze-footer-top)",
          "footer-bottom": "var(--breeze-footer-bottom)",
        },
        soft: "var(--bg-soft)",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "var(--gradient-brand)",
        "brand-gradient-text": "var(--gradient-brand-text)",
        "brand-gradient-cta": "var(--gradient-cta)",
        "footer-gradient": "var(--gradient-footer)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(13,34,66,.06), 0 8px 24px rgba(13,34,66,.06)",
      },
      borderRadius: { pill: "9999px" },
    },
  },
  plugins: [],
};
export default config;
