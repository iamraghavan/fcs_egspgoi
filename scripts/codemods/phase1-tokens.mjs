#!/usr/bin/env node
// One-off codemod for UI redesign Phase 1 (kept for review/reproducibility).
//  1. Raw Tailwind palette classes (bg-green-100, text-red-700 ...) -> semantic tokens.
//     `dark:` variants of raw palette classes are dropped: tokens already switch with the theme.
//  2. Arbitrary font sizes below/near 12px -> `text-caption` (12px); 13px -> `text-body` (14px).
//  3. `uppercase` (+ its letter-spacing) removed. Kept only on `font-mono` identifiers
//     (faculty IDs etc.), where it normalises codes rather than styling prose.
// The admissions microsite (src/app/admissions) is excluded.
// Usage: node scripts/codemods/phase1-tokens.mjs [--dry]
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SRC = join(ROOT, "src");
const EXCLUDE = join(SRC, "app", "admissions");
const DRY = process.argv.includes("--dry");

const FAMILY = {
  success: ["green", "emerald", "lime"],
  danger: ["red", "rose"],
  warning: ["yellow", "amber", "orange"],
  primary: ["blue", "indigo"],
  info: ["sky", "cyan", "teal"],
  violet: ["violet", "purple", "fuchsia", "pink"],
  neutral: ["slate", "gray", "zinc", "neutral", "stone"],
};
const familyOf = Object.fromEntries(Object.entries(FAMILY).flatMap(([k, v]) => v.map((c) => [c, k])));
const COLORS = Object.values(FAMILY).flat().join("|");
const UTILS =
  "ring-offset|bg|text|border(?:-[trblxy])?|ring|from|to|via|fill|stroke|outline|divide|shadow|placeholder|decoration|caret|accent";
// variant prefix chain, e.g. `hover:`, `dark:`, `group-[.destructive]:hover:`
const PALETTE_RE = new RegExp(
  String.raw`(?<![\w-])((?:[\w-]+(?:\[[^\]\s]*\])?[\w-]*:)*)(${UTILS})-(${COLORS})-(\d{2,3})(\/\d+)?(?![\w/-])`,
  "g",
);

const BG = new Set(["bg", "from", "to", "via"]);
const TEXTY = new Set(["text", "fill", "stroke", "placeholder", "decoration", "caret", "accent"]);

function mapPalette(util, fam, shade, alpha = "") {
  const base = util.startsWith("border") ? "border" : util;
  const isBg = BG.has(base);
  const isText = TEXTY.has(base);
  if (base === "shadow") return "";
  if (fam === "neutral") {
    if (isText)
      return `${util}-${shade >= 700 ? "foreground" : shade >= 400 ? "muted-foreground" : "background"}${alpha}`;
    if (isBg) return `${util}-${shade <= 300 ? "muted" : shade <= 700 ? "muted-foreground" : "foreground"}${alpha}`;
    return `${util}-${shade <= 300 ? "border" : "border-strong"}${alpha}`;
  }
  if (fam === "primary") {
    if (isText) return `${util}-${shade >= 700 ? "primary-700" : "primary"}${alpha}`;
    if (isBg) return `${util}-${shade <= 100 ? "primary-50" : shade <= 300 ? "primary-100" : "primary"}${alpha}`;
    return `${util}-${shade <= 300 ? "primary-200" : "primary"}${alpha}`;
  }
  if (isText) return `${util}-${shade >= 600 ? `${fam}-text` : fam}${alpha}`;
  if (isBg) return `${util}-${shade <= 300 ? `${fam}-bg` : fam}${alpha}`;
  return `${util}-${fam}${alpha || (shade <= 300 ? "/40" : "")}`;
}

const FONT_RE = /(?<![\w-])((?:[\w-]+:)*)text-\[(\d+(?:\.\d+)?)(px|rem)\](?![\w-])/g;
function mapFont(prefix, n, unit) {
  const px = unit === "rem" ? Number(n) * 16 : Number(n);
  return `${prefix}text-${px <= 12.9 ? "caption" : px <= 15 ? "body" : px <= 17 ? "body-lg" : px <= 19 ? "title-sm" : px <= 22 ? "section" : px <= 27 ? "page" : "kpi"}`;
}

// Operates on each quoted/template string that contains `uppercase` as a class token.
const STR_RE = /(["'`])((?:(?!\1)[^\\]|\\.)*?)\1/g;
const TRACKING_RE = /(?<![\w-])tracking-(?:wide|wider|widest|\[[\d.]+em\])(?![\w-])/g;
function fixUppercase(src) {
  return src.replace(STR_RE, (whole, q, body) => {
    if (!/(?<![\w-])uppercase(?![\w-])/.test(body)) return whole;
    if (/(?<![\w-])font-mono(?![\w-])/.test(body))
      return q + body.replace(TRACKING_RE, "").replace(/ {2,}/g, " ").trim() + q;
    const out = body
      .replace(/(?<![\w-])((?:[\w-]+:)*)uppercase(?![\w-])/g, "")
      .replace(TRACKING_RE, "")
      .replace(/ {2,}/g, " ")
      .trim();
    return q + out + q;
  });
}

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (p === EXCLUDE) continue;
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx|ts)$/.test(name) && !/\.test\.tsx?$/.test(name)) files.push(p);
  }
  return files;
}

const report = [];
for (const file of walk(SRC)) {
  const before = readFileSync(file, "utf8");
  let after = before.replace(PALETTE_RE, (m, prefix, util, color, shade, alpha) => {
    if (/(^|:)dark:/.test(prefix) || prefix.startsWith("dark:")) return "";
    const mapped = mapPalette(util, familyOf[color], Number(shade), alpha || "");
    return mapped ? prefix + mapped : "";
  });
  after = after.replace(FONT_RE, (m, prefix, n, unit) => mapFont(prefix, n, unit));
  after = fixUppercase(after);
  // tidy double spaces created inside class strings by removals
  after = after.replace(/(className="[^"]*?) {2,}/g, "$1 ");
  if (after !== before) {
    report.push(relative(ROOT, file).split(sep).join("/"));
    if (!DRY) writeFileSync(file, after);
  }
}
console.log(`${DRY ? "[dry] " : ""}changed ${report.length} files`);
for (const f of report) console.log("  " + f);
