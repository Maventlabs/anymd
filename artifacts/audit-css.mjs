// Read-only audit script for app/globals.css. Writes report to artifacts/audit-report.txt
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

const css = readFileSync("app/globals.css", "utf8");
const lines = css.split(/\r?\n/);

function skipWs() {
  while (i < n) {
    const c = css[i];
    if (c === "\n") line++;
    if (c === " " || c === "\t" || c === "\n" || c === "\r") i++;
    else break;
  }
}

function readUntil(chars) {
  let out = "";
  while (i < n && !chars.includes(css[i])) {
    if (css[i] === "\n") line++;
    out += css[i++];
  }
  return out;
}

function readBalanced() {
  let depth = 1;
  const bodyStart = i;
  while (i < n && depth > 0) {
    if (css[i] === "/" && css[i + 1] === "*") {
      const idx = css.indexOf("*/", i + 2);
      i = idx === -1 ? n : idx + 2;
      continue;
    }
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
    if (css[i] === "\n") line++;
    i++;
  }
  return css.slice(bodyStart, i - 1);
}

const blocks = [];
let i = 0;
let line = 1;
const n = css.length;

skipWs();
while (i < n) {
  const startLine = line;
  if (css.startsWith("/*", i)) {
    const idx = css.indexOf("*/", i + 2);
    const seg = css.slice(i, idx === -1 ? n : idx + 2);
    line += (seg.match(/\n/g) || []).length;
    i = idx === -1 ? n : idx + 2;
    skipWs();
    continue;
  }
  if (css[i] === "@") {
    const atHeader = readUntil("{;");
    if (css[i] === ";") {
      i++;
      blocks.push({ kind: "other-atrule", selector: atHeader.trim(), start: startLine, end: line, body: "" });
      skipWs();
      continue;
    }
    i++; // {
    const body = readBalanced();
    const header = atHeader.trim();
    const kind = header.startsWith("@media") ? "media"
      : header.startsWith("@keyframes") ? "keyframes"
      : header.startsWith("@theme") || header.startsWith("@custom-variant") || header.startsWith("@source") ? "tailwind-atrule"
      : "other-atrule";
    blocks.push({ kind, selector: header, start: startLine, end: line, body });
    skipWs();
    continue;
  }
  const selector = readUntil("{").trim();
  if (css[i] !== "{") break;
  i++;
  const decls = readBalanced();
  blocks.push({ kind: "rule", selector, start: startLine, end: line, body: decls });
  skipWs();
}

function normalizeDecls(raw, sort) {
  const noComments = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const parts = noComments.split(";").map(s => s.trim()).filter(Boolean);
  const norm = parts.map(p => p.replace(/\s+/g, " "));
  const uniq = Array.from(new Set(norm));
  const list = sort ? [...uniq].sort() : uniq;
  return list.join("; ");
}

const ruleBlocks = blocks.filter(b => b.kind === "rule");
const map = new Map();
for (const b of ruleBlocks) {
  if (!map.has(b.selector)) map.set(b.selector, []);
  map.get(b.selector).push(b);
}

const dupIdentical = [];
const dupDiff = [];
for (const [selector, list] of map) {
  if (list.length < 2) continue;
  const variants = new Map();
  for (const b of list) {
    const key = normalizeDecls(b.body, true);
    if (!variants.has(key)) variants.set(key, []);
    variants.get(key).push(b);
  }
  for (const [declKey, group] of variants) {
    if (group.length >= 2) {
      dupIdentical.push(
        "SELECTOR " + selector + " x" + group.length + " identical at lines " +
        group.map(g => g.start + "-" + g.end).join(", ") +
        "\n  decls: " + declKey.slice(0, 400)
      );
    }
  }
  if (variants.size > 1) {
    dupDiff.push({
      selector,
      occurrences: list.map(b => ({ start: b.start, end: b.end, decls: normalizeDecls(b.body, true).slice(0, 260) })),
    });
  }
}

const mediaBlocks = blocks.filter(b => b.kind === "media");
const mediaCounts = new Map();
for (const m of mediaBlocks) {
  const cond = m.selector.replace("@media", "").trim();
  mediaCounts.set(cond, (mediaCounts.get(cond) ?? 0) + 1);
}

const importantLines = [];
lines.forEach((l, idx) => {
  if (l.includes("!important")) importantLines.push({ line: idx + 1, text: l.trim().slice(0, 140) });
});

const kfNames = [];
for (const b of blocks.filter(b => b.kind === "keyframes")) {
  const m = b.selector.match(/@keyframes\s+([\w-]+)/);
  if (m) kfNames.push(m[1]);
}
const kfUsage = kfNames.map(name => {
  const cssRefs = (css.match(new RegExp("animation(?:-name)?\\s*:[^;]*\\b" + name + "\\b", "g")) || []).length;
  return { name, cssRefs };
});

const declSigMap = new Map();
for (const b of ruleBlocks) {
  const d = normalizeDecls(b.body, true);
  if (!d) continue;
  if (!declSigMap.has(d)) declSigMap.set(d, []);
  declSigMap.get(d).push(b.selector);
}
const copyPaste = [...declSigMap.entries()]
  .filter(([, sels]) => sels.length >= 3)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 25)
  .map(([decl, sels]) => ("x" + sels.length + ": " + sels.slice(0, 10).join(" | ") + "\n  decls: " + decl.slice(0, 220)));

let srcGrep = "";
try {
  srcGrep = execSync(
    'rg -o --no-filename -g "*.tsx" -g "*.ts" -g "*.js" -g "*.mjs" -g "!node_modules" -g "!artifacts" -g "!.next" "[A-Za-z_][A-Za-z0-9_-]{2,}" app components lib db tests e2e scripts 2>nul || true',
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
} catch { srcGrep = ""; }
const srcTokens = new Set(srcGrep.split(/\s+/).filter(Boolean));

const classSelectorRe = /\.([A-Za-z_][A-Za-z0-9_-]+)/g;
const cssClasses = new Map();
let mm = null;
while ((mm = classSelectorRe.exec(css))) {
  const name = mm[1];
  cssClasses.set(name, (cssClasses.get(name) ?? 0) + 1);
}
const unusedCandidates = [];
for (const [name] of cssClasses) {
  if (!srcTokens.has(name)) unusedCandidates.push(name);
}

const report = [
  "=== AUDIT REPORT app/globals.css ===",
  "total lines: " + lines.length + ", bytes: " + Buffer.byteLength(css),
  "",
  "--- R1. IDENTICAL DUPLICATE TOP-LEVEL RULES (same selector + same decls) ---",
  dupIdentical.length ? dupIdentical.join("\n\n") : "(none)",
  "",
  "--- R2. SELECTORS APPEARING MULTIPLE TIMES WITH DIFFERENT DECLS (count: " + dupDiff.length + ") ---",
  dupDiff.map(d => d.selector + "\n" + d.occurrences.map(o => "  L" + o.start + "-" + o.end + ": " + o.decls).join("\n")).join("\n\n"),
  "",
  "--- R3. MEDIA QUERY CONDITIONS ---",
  [...mediaCounts.entries()].sort((a, b) => b[1] - a[1]).map(([c, n2]) => n2 + "x  " + c).join("\n"),
  "",
  "--- R4. !important (count: " + importantLines.length + ") ---",
  importantLines.length ? importantLines.map(l => "L" + l.line + ": " + l.text).join("\n") : "(none)",
  "",
  "--- R5. KEYFRAMES ---",
  kfUsage.map(k => k.name + ": " + k.cssRefs + " css refs").join("\n"),
  "",
  "--- R6. COPY-PASTE IDENTICAL DECL GROUPS ACROSS SELECTORS (>=3) ---",
  copyPaste.length ? copyPaste.join("\n\n") : "(none)",
  "",
  "--- R7. CLASS SELECTORS WITH NO TOKEN MATCH IN SOURCE (candidates; verify before delete) ---",
  "count: " + unusedCandidates.length,
  unusedCandidates.join(", "),
].join("\n");

writeFileSync("artifacts/audit-report.txt", report);
console.log("blocks:", blocks.length, "| rules:", ruleBlocks.length, "| media:", mediaBlocks.length, "| keyframes:", kfNames.length);
console.log("identical dup rules:", dupIdentical.length, "| multi-occurrence selectors:", dupDiff.length, "| !important:", importantLines.length, "| unused candidates:", unusedCandidates.length);
console.log("report written to artifacts/audit-report.txt");
