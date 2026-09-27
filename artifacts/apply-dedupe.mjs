// Batch 1 executor: remove identical duplicate rules (keep LAST occurrence).
// Re-parses app/globals.css with the same context-aware parser as audit v2,
// recomputes groups live (so edits 1-2 shifting lines are handled), and rewrites the file.
import { readFileSync, writeFileSync } from "node:fs";

let css = readFileSync("app/globals.css", "utf8");

let i = 0;
let n = css.length;
let line = 1;

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
  const start = i;
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
  return css.slice(start, i - 1);
}

const rules = [];
function parseInto(ctx) {
  while (i < n) {
    skipWs();
    if (i >= n) break;
    const startLine = line;
    if (css.startsWith("/*", i)) {
      const idx = css.indexOf("*/", i + 2);
      i = idx === -1 ? n : idx + 2;
      continue;
    }
    if (css[i] === "@") {
      const header = readUntil("{;").trim();
      if (css[i] === ";") { i++; continue; }
      i++;
      if (header.startsWith("@media") || header.startsWith("@supports")) {
        const bodyStart = i;
        const bodyLineStart = line;
        const body = readBalanced();
        const outer = { css, i, n, line };
        css = body; i = 0; n = body.length; line = bodyLineStart;
        parseInto(ctx.concat(header));
        css = outer.css; i = outer.i; n = outer.n; line = outer.line;
      } else {
        readBalanced();
      }
      continue;
    }
    const selector = readUntil("{").trim();
    if (css[i] !== "{") break;
    i++;
    const decls = readBalanced();
    rules.push({ selector, decls, start: startLine, end: line, ctx: ctx.join(" && ") || "(top)" });
  }
}
parseInto([]);

function normDecls(raw) {
  const noComments = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const parts = noComments.split(";").map(s => s.trim().replace(/\s+/g, " ")).filter(Boolean);
  return Array.from(new Set(parts)).sort().join("; ");
}

const groups = new Map();
for (const r of rules) {
  const key = r.selector + "\nCTX: " + r.ctx + "\nDECLS: " + normDecls(r.decls);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}

// compute removal ranges: every occurrence except the LAST of each identical group
const removals = [];
let groupCount = 0;
for (const [, list] of groups) {
  if (list.length < 2) continue;
  groupCount++;
  const sorted = [...list].sort((a, b) => a.start - b.start);
  for (const r of sorted.slice(0, -1)) removals.push([r.start, r.end]);
}
console.log("identical groups:", groupCount, "| blocks to remove:", removals.length);

// swallow one trailing blank line per removal to avoid double blanks
const lineCount = css.split(/\r?\n/).length;
const expanded = removals.map(([s, e]) => {
  const after = e + 1;
  if (after <= lineCount) {
    const l = css.split(/\r?\n/)[after - 1];
    if (l !== undefined && l.trim() === "") return [s, e + 1];
  }
  return [s, e];
});
// merge overlapping ranges
expanded.sort((a, b) => a[0] - b[0]);
const merged = [];
for (const [s, e] of expanded) {
  const last = merged[merged.length - 1];
  if (last && s <= last[1] + 1) last[1] = Math.max(last[1], e);
  else merged.push([s, e]);
}

const lines = css.split(/\r?\n/);
const keep = new Array(lines.length).fill(true);
for (const [s, e] of merged) for (let k = s; k <= e; k++) keep[k - 1] = false;
const result = lines.filter((_, idx) => keep[idx]).join("\n");

writeFileSync("app/globals.css", result);
console.log("removed ranges:", merged.length, "| new line count:", result.split(/\r?\n/).length);
