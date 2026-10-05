import type { Config } from "tailwindcss";

// Every colour, radius, shadow, font size and grid spacing below reads from the
// design tokens in src/styles/tokens.css (generated from scripts/tokens/tokens.config.mjs).
const tok = (name: string) => `hsl(var(--${name}) / <alpha-value>)`;
const shades = (prefix: string, keys: string[]) => Object.fromEntries(keys.map((k) => [k, tok(`${prefix}-${k}`)]));

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
        display: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Consolas", "monospace"],
      },
      fontSize: {
        caption: ["var(--font-size-caption)", { lineHeight: "var(--line-height-caption)" }],
        body: ["var(--font-size-body)", { lineHeight: "var(--line-height-body)" }],
        "body-lg": ["var(--font-size-body-lg)", { lineHeight: "var(--line-height-body-lg)" }],
        "title-sm": ["var(--font-size-title-sm)", { lineHeight: "var(--line-height-title-sm)" }],
        section: ["var(--font-size-section)", { lineHeight: "var(--line-height-section)" }],
        page: ["var(--font-size-page)", { lineHeight: "var(--line-height-page)" }],
        kpi: ["var(--font-size-kpi)", { lineHeight: "var(--line-height-kpi)" }],
      },
      spacing: {
        // 8-pt grid from tokens (same values as Tailwind's defaults for these steps)
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        6: "var(--space-5)",
        8: "var(--space-6)",
        12: "var(--space-7)",
        16: "var(--space-8)",
        // Temporary Carbon aliases (removed as screens are migrated)
        "cds-01": "var(--cds-spacing-01)",
        "cds-02": "var(--cds-spacing-02)",
        "cds-03": "var(--cds-spacing-03)",
        "cds-04": "var(--cds-spacing-04)",
        "cds-05": "var(--cds-spacing-05)",
        "cds-06": "var(--cds-spacing-06)",
        "cds-07": "var(--cds-spacing-07)",
        "cds-08": "var(--cds-spacing-08)",
        "cds-09": "var(--cds-spacing-09)",
        "cds-10": "var(--cds-spacing-10)",
      },
      colors: {
        background: tok("background"),
        foreground: {
          DEFAULT: tok("foreground"),
          "2": tok("text-2"),
        },
        surface: { DEFAULT: tok("surface"), "2": tok("surface-2") },
        card: { DEFAULT: tok("card"), foreground: tok("card-foreground") },
        popover: { DEFAULT: tok("popover"), foreground: tok("popover-foreground") },
        primary: {
          DEFAULT: tok("primary"),
          foreground: tok("primary-foreground"),
          hover: tok("primary-hover"),
          ...shades("primary", ["50", "100", "200", "500", "600", "700", "800"]),
        },
        link: tok("link"),
        secondary: { DEFAULT: tok("secondary"), foreground: tok("secondary-foreground") },
        muted: { DEFAULT: tok("muted"), foreground: tok("muted-foreground") },
        accent: { DEFAULT: tok("accent"), foreground: tok("accent-foreground") },
        destructive: { DEFAULT: tok("destructive"), foreground: tok("destructive-foreground") },
        // Credits & achievements (amber); use credit-text for text on light surfaces
        credit: { "400": tok("accent-400"), "500": tok("accent-500"), text: tok("accent-text") },
        success: { DEFAULT: tok("success"), text: tok("success-text"), bg: tok("success-bg") },
        warning: { DEFAULT: tok("warning"), text: tok("warning-text"), bg: tok("warning-bg") },
        danger: { DEFAULT: tok("danger"), text: tok("danger-text"), bg: tok("danger-bg") },
        info: { DEFAULT: tok("info"), text: tok("info-text"), bg: tok("info-bg") },
        violet: { DEFAULT: tok("violet"), text: tok("violet-text"), bg: tok("violet-bg") },
        border: { DEFAULT: tok("border"), strong: tok("border-strong") },
        input: tok("input"),
        ring: tok("ring"),
        nav: {
          bg: tok("nav-bg"),
          hover: tok("nav-hover"),
          active: tok("nav-active"),
          text: tok("nav-text"),
          "text-active": tok("nav-text-active"),
        },
        chart: shades("chart", ["1", "2", "3", "4", "5", "6", "7"]),
        sidebar: {
          DEFAULT: tok("sidebar-background"),
          foreground: tok("sidebar-foreground"),
          primary: tok("sidebar-primary"),
          "primary-foreground": tok("sidebar-primary-foreground"),
          accent: tok("sidebar-accent"),
          "accent-foreground": tok("sidebar-accent-foreground"),
          border: tok("sidebar-border"),
          ring: tok("sidebar-ring"),
        },
        // Temporary Carbon aliases (removed as screens are migrated)
        cds: {
          interactive: {
            "01": "var(--cds-interactive-01)",
            "02": "var(--cds-interactive-02)",
            "03": "var(--cds-interactive-03)",
            "04": "var(--cds-interactive-04)",
          },
          ui: {
            "01": "var(--cds-ui-01)",
            "02": "var(--cds-ui-02)",
            "03": "var(--cds-ui-03)",
            "04": "var(--cds-ui-04)",
            "05": "var(--cds-ui-05)",
          },
          text: {
            "01": "var(--cds-text-01)",
            "02": "var(--cds-text-02)",
            "03": "var(--cds-text-03)",
            "04": "var(--cds-text-04)",
            "05": "var(--cds-text-05)",
          },
          support: {
            "01": "var(--cds-support-01)",
            "02": "var(--cds-support-02)",
            "03": "var(--cds-support-03)",
            "04": "var(--cds-support-04)",
          },
        },
      },
      borderRadius: {
        sm: "4px",
        md: "var(--radius-control)", // inputs, buttons (6px)
        lg: "var(--radius-card)", // cards (8px)
        xl: "var(--radius-modal)", // modals, drawers (12px)
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionDuration: {
        fast: "var(--motion-fast)",
        base: "var(--motion-base)",
        slow: "var(--motion-slow)",
      },
      ringColor: { DEFAULT: tok("ring") },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
} satisfies Config;
