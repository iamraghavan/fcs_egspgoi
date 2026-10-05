// Counts styling that bypasses the design tokens (used for the UI redesign reports).
// Usage: node scripts/design-metrics.mjs   (excludes src/app/admissions, which is out of scope)
import fs from "fs";
import path from "path";

const ROOT = "src";
const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full.replace(/\\/g, "/").includes("src/app/admissions")) continue;
      walk(full);
    } else if (/\.(tsx|ts)$/.test(entry.name)) files.push(full);
  }
})(ROOT);

const PALETTE =
  "(red|blue|green|amber|yellow|orange|emerald|slate|gray|zinc|indigo|purple|pink|sky|teal|rose|violet|cyan|lime|neutral|stone)";
const rules = {
  hexColors: /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-fA-F])/g,
  rawPaletteClasses: new RegExp(
    `\\b(text|bg|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|accent|caret|decoration|shadow)-${PALETTE}-[0-9]{2,3}\\b`,
    "g",
  ),
  arbitraryValues: /\b[a-z][a-z-]*-\[[^\]\s]+\]/g,
  arbitraryFontSizes: /\btext-\[[0-9.]+(px|rem)\]/g,
  textBelow12px: /\btext-\[(9|10|11)px\]/g,
  cdsUses: /\bcds-[a-z0-9-]+|--cds-[a-z0-9-]+/g,
  roundedNone: /\brounded-none\b/g,
  uppercase: /\buppercase\b/g,
  materialSymbols: /material-symbols-[a-z]+/g,
};

const totals = Object.fromEntries(Object.keys(rules).map((k) => [k, 0]));
const perFile = {};
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const [name, re] of Object.entries(rules)) {
    const n = (text.match(re) || []).length;
    totals[name] += n;
    if (n) (perFile[name] ||= []).push([file, n]);
  }
}
console.log(JSON.stringify({ files: files.length, ...totals }, null, 2));
if (process.argv.includes("--files")) {
  for (const [name, list] of Object.entries(perFile)) {
    console.log(`\n${name}:`);
    list.sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`  ${n}\t${f}`));
  }
}
