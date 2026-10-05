// Builds src/styles/tokens.css from tokens.config.mjs and checks WCAG contrast.
// Usage: node scripts/tokens/build-tokens.mjs [--check]   (--check: no write, exit 1 on contrast failure)
import fs from "fs";
import {
  palette,
  shadcn,
  themeAliases,
  accents,
  accentContrastPairs,
  scales,
  contrastPairs,
} from "./tokens.config.mjs";

const OUT = "src/styles/tokens.css";

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}
// Space-separated HSL channels so Tailwind opacity modifiers work: hsl(var(--x) / 0.1)
function hexToHslChannels(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  const round = (v, p = 1) => Math.round(v * 10 ** p) / 10 ** p;
  return `${round(h)} ${round(s * 100)}% ${round(l * 100)}%`;
}
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  return (
    "#" +
    a
      .map((v, i) =>
        Math.round(v * t + b[i] * (1 - t))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
      .toUpperCase()
  );
}

// primary-* values of an accent in a theme (null accent = default palette)
function accentShades(accent, theme) {
  const def = accents[accent];
  if (!def) return {};
  const out = {};
  for (const [k, hex] of Object.entries(def)) out[`primary-${k}`] = hex;
  if (theme === "dark") {
    out["primary-50"] = mix(def[600], palette.dark.bg, 0.14);
    out["primary-100"] = mix(def[600], palette.dark.bg, 0.24);
    out["primary-200"] = mix(def[600], palette.dark.bg, 0.38);
  }
  return out;
}

// Resolve a token name to hex in a theme, following aliases and accent overrides.
function resolve(theme, name, accent = "blue", depth = 0) {
  if (depth > 5) throw new Error(`alias loop at ${name}`);
  const acc = accentShades(accent, theme);
  if (acc[name]) return acc[name];
  if (palette[theme][name]) return palette[theme][name];
  const ref = themeAliases[theme][name] || shadcn[name];
  if (!ref) throw new Error(`unknown token ${name}`);
  return resolve(theme, ref, accent, depth + 1);
}

function themeBlock(theme) {
  const p = palette[theme];
  const lines = [];
  lines.push("  /* palette (HSL channels; use as hsl(var(--name))) */");
  for (const [name, hex] of Object.entries(p)) lines.push(`  --${name}: ${hexToHslChannels(hex)}; /* ${hex} */`);
  lines.push("  /* shadcn semantic names */");
  // Skip identity aliases (e.g. border → border): `--x: var(--x)` is a cycle and makes the value invalid.
  for (const [name, ref] of Object.entries(shadcn)) if (name !== ref) lines.push(`  --${name}: var(--${ref});`);
  lines.push("  /* light/dark specific aliases */");
  for (const [name, ref] of Object.entries(themeAliases[theme])) lines.push(`  --${name}: var(--${ref});`);
  return lines.join("\n");
}

function staticBlock() {
  const lines = [];
  for (const [k, v] of Object.entries(scales.radius)) lines.push(`  --radius-${k}: ${v};`);
  lines.push("  --radius: var(--radius-card); /* shadcn base radius */");
  for (const [k, v] of Object.entries(scales.shadow)) lines.push(`  --shadow-${k}: ${v};`);
  for (const [k, [size, lh]] of Object.entries(scales.font))
    lines.push(`  --font-size-${k}: ${size};\n  --line-height-${k}: ${lh};`);
  for (const [k, v] of Object.entries(scales.space)) lines.push(`  --space-${k}: ${v};`);
  for (const [k, v] of Object.entries(scales.motion)) lines.push(`  --motion-${k}: ${v};`);
  lines.push("  --focus-ring: 0 0 0 3px hsl(var(--primary-600) / 0.35);");
  lines.push("  /* accent swatches for the Appearance menu (fixed, not theme-dependent) */");
  for (const [name, def] of Object.entries(accents))
    lines.push(`  --swatch-${name}: ${hexToHslChannels(def ? def[600] : palette.light["primary-600"])};`);
  return lines.join("\n");
}

function accentBlocks() {
  const out = [];
  for (const accent of Object.keys(accents)) {
    if (!accents[accent]) continue;
    for (const theme of ["light", "dark"]) {
      const sel = theme === "light" ? `:root[data-accent="${accent}"]` : `:root.dark[data-accent="${accent}"]`;
      const lines = Object.entries(accentShades(accent, theme)).map(
        ([n, hex]) => `  --${n}: ${hexToHslChannels(hex)}; /* ${hex} */`,
      );
      out.push(`${sel} {\n${lines.join("\n")}\n}`);
    }
  }
  return out.join("\n\n");
}

function checkContrast() {
  const results = [];
  for (const theme of ["light", "dark"]) {
    for (const [fg, bg, min] of contrastPairs) {
      const ratio = contrast(resolve(theme, fg), resolve(theme, bg));
      results.push({ accent: "base", theme, fg, bg, min, ratio: Math.round(ratio * 100) / 100, pass: ratio >= min });
    }
    for (const accent of Object.keys(accents)) {
      for (const [fg, bg, min] of accentContrastPairs) {
        const ratio = contrast(resolve(theme, fg, accent), resolve(theme, bg, accent));
        results.push({ accent, theme, fg, bg, min, ratio: Math.round(ratio * 100) / 100, pass: ratio >= min });
      }
    }
  }
  return results;
}

const css = `/*
 * GENERATED by scripts/tokens/build-tokens.mjs from scripts/tokens/tokens.config.mjs.
 * Do not edit by hand. Light = :root, dark = .dark (set by next-themes).
 */
:root {
${themeBlock("light")}
${staticBlock()}
  color-scheme: light;
}

.dark {
${themeBlock("dark")}
  color-scheme: dark;
}

/* Accent themes: set data-accent on <html> (Appearance menu). Only primary-* changes. */
${accentBlocks()}

@media (prefers-reduced-motion: reduce) {
  :root { --motion-fast: 0ms; --motion-base: 0ms; --motion-slow: 0ms; }
}
`;

const results = checkContrast();
const failures = results.filter((r) => !r.pass);
if (!process.argv.includes("--check")) {
  fs.mkdirSync("src/styles", { recursive: true });
  fs.writeFileSync(OUT, css);
  fs.writeFileSync("docs/contrast-report.json", JSON.stringify(results, null, 2) + "\n");
  console.log(`wrote ${OUT}`);
}
for (const r of results) {
  console.log(
    `${r.pass ? "PASS" : "FAIL"}  ${r.accent.padEnd(6)} ${r.theme.padEnd(5)}  ${r.fg.padEnd(16)} on ${r.bg.padEnd(13)} ${String(r.ratio).padStart(5)}:1  (min ${r.min})`,
  );
}
console.log(`\n${results.length - failures.length}/${results.length} pairs pass`);
if (failures.length) process.exit(1);
