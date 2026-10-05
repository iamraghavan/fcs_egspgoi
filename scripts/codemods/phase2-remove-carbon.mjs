#!/usr/bin/env node
// One-off codemod for UI redesign Phase 2: remove the IBM Carbon look.
//  1. `cds-*` Tailwind colour classes -> semantic token classes (keeps variant prefixes and /opacity).
//  2. `var(--cds-*)` in inline styles / chart props -> hsl(var(--token)).
//  3. `rounded-none` removed (components fall back to the token radii: 6/8/12 px).
//  4. Chart axis font sizes below 12 px -> 12.
// The admissions microsite (src/app/admissions) is excluded.
// Usage: node scripts/codemods/phase2-remove-carbon.mjs [--dry]
import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const SRC = join(ROOT, "src");
const EXCLUDE = join(SRC, "app", "admissions");
const DRY = process.argv.includes("--dry");

// Carbon role -> token, per utility kind. Text on support colours uses the readable *-text tokens.
const CLASS_MAP = {
  "interactive-01": { any: "primary" },
  "interactive-02": { any: "foreground-2" },
  "interactive-03": { any: "primary" },
  "interactive-04": { any: "primary" },
  "ui-background": { any: "card" },
  "ui-01": { any: "muted" },
  "ui-02": { any: "card" },
  "ui-03": { any: "border" },
  "ui-04": { any: "input" },
  "ui-05": { any: "foreground" },
  "text-01": { any: "foreground" },
  "text-02": { any: "foreground-2" },
  "text-03": { any: "muted-foreground" },
  "text-04": { any: "primary-foreground" },
  "text-05": { any: "muted-foreground" },
  "support-01": { text: "danger-text", any: "danger" },
  "support-02": { text: "success-text", any: "success" },
  "support-03": { text: "credit-text", any: "warning" },
  "support-04": { text: "info-text", any: "info" },
};
const VAR_MAP = {
  "interactive-01": "primary",
  "interactive-02": "text-2",
  "interactive-03": "primary",
  "interactive-04": "primary",
  "ui-background": "card",
  "ui-01": "muted",
  "ui-02": "card",
  "ui-03": "border",
  "ui-04": "input",
  "ui-05": "foreground",
  "text-01": "foreground",
  "text-02": "text-2",
  "text-03": "muted-foreground",
  "text-04": "primary-foreground",
  "text-05": "muted-foreground",
  "support-01": "danger",
  "support-02": "success",
  "support-03": "warning",
  "support-04": "info",
};

const CLASS_RE =
  /(?<![\w-])((?:[\w-]+(?:\[[^\]\s]*\])?[\w-]*:)*)(bg|text|border(?:-[trblxy])?|divide|ring|fill|stroke|placeholder|outline|from|to|via)-cds-([a-z]+-(?:0\d|background))(\/\d+)?(?![\w-])/g;
const VAR_RE = /var\(--cds-([a-z]+-(?:0\d|background))\)/g;

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (p === EXCLUDE) continue;
    if (statSync(p).isDirectory()) walk(p, files);
    else if (/\.(tsx|ts)$/.test(name)) files.push(p);
  }
  return files;
}

const unknown = new Set();
const changed = [];
for (const file of walk(SRC)) {
  const before = readFileSync(file, "utf8");
  let after = before.replace(CLASS_RE, (m, prefix, util, role, alpha = "") => {
    const map = CLASS_MAP[role];
    if (!map) {
      unknown.add(m);
      return m;
    }
    const kind = util === "text" || util === "placeholder" ? "text" : "any";
    const tokenName = map[kind] || map.any;
    // `placeholder:text-x` has util "text" with a placeholder: prefix; plain `placeholder-x` is rare
    return `${prefix}${util}-${tokenName}${alpha}`;
  });
  after = after.replace(VAR_RE, (m, role) => {
    const t = VAR_MAP[role];
    if (!t) {
      unknown.add(m);
      return m;
    }
    return `hsl(var(--${t}))`;
  });
  after = after.replace(/(?<![\w-])rounded-none(?![\w-])\s?/g, "");
  after = after.replace(/fontSize=\{(9|10|11)\}/g, "fontSize={12}");
  after = after.replace(/className=" /g, 'className="');
  if (after !== before) {
    changed.push(relative(ROOT, file).split(sep).join("/"));
    if (!DRY) writeFileSync(file, after);
  }
}
console.log(`${DRY ? "[dry] " : ""}changed ${changed.length} files`);
if (unknown.size) console.log("UNMAPPED:", [...unknown].join(", "));
