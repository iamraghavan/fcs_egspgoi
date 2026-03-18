import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
        display: ['IBM Plex Sans', 'sans-serif'],
        body: ['IBM Plex Sans', 'sans-serif'],
      },
      spacing: {
        'cds-01': 'var(--cds-spacing-01)',
        'cds-02': 'var(--cds-spacing-02)',
        'cds-03': 'var(--cds-spacing-03)',
        'cds-04': 'var(--cds-spacing-04)',
        'cds-05': 'var(--cds-spacing-05)',
        'cds-06': 'var(--cds-spacing-06)',
        'cds-07': 'var(--cds-spacing-07)',
        'cds-08': 'var(--cds-spacing-08)',
        'cds-09': 'var(--cds-spacing-09)',
        'cds-10': 'var(--cds-spacing-10)',
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        cds: {
          interactive: {
            '01': 'var(--cds-interactive-01)',
            '02': 'var(--cds-interactive-02)',
            '03': 'var(--cds-interactive-03)',
            '04': 'var(--cds-interactive-04)',
          },
          ui: {
            '01': 'var(--cds-ui-01)',
            '02': 'var(--cds-ui-02)',
            '03': 'var(--cds-ui-03)',
            '04': 'var(--cds-ui-04)',
            '05': 'var(--cds-ui-05)',
          },
          text: {
            '01': 'var(--cds-text-01)',
            '02': 'var(--cds-text-02)',
            '03': 'var(--cds-text-03)',
            '04': 'var(--cds-text-04)',
            '05': 'var(--cds-text-05)',
          },
          support: {
            '01': 'var(--cds-support-01)',
            '02': 'var(--cds-support-02)',
            '03': 'var(--cds-support-03)',
            '04': 'var(--cds-support-04)',
          }
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/forms')],
} satisfies Config;