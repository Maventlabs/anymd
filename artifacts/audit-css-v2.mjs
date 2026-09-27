// Audit v2: context-aware duplicate detection + safe dedupe plan generation.
// Parses globals.css recursively (tracks @media nesting), groups identical rules,
// clusters by context, and emits per-cluster "keep last, remove earlier" plan.
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

// collect rules recursively with context chain
const rules = [];
const medias = [];

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
      if (css[i] === ";") { i++; continue; } // at-rule without block
      i++; // {
      if (header.startsWith("@media") || header.startsWith("@supports")) {
        const bodyStart = i;
        const bodyLineStart = line;
        const body = readBalanced();
        medias.push({ header, start: startLine, end: line, body });
        // recurse into media body by substring parse
        const saved = { css, i, n, line };
        cssSubParse(body, bodyLineStart, ctx.concat(header), rules);
        // restore outer cursor
        css = saved.css; i = saved.i; n = saved.n; line = saved.line;
      } else {
        readBalanced(); // keyframes/theme/etc: skip body
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

function cssSubParse(sub, startLineOffset, ctx, out) {
  // temporarily swap parse targets
  const outerCss = css, outerI = i, outerN = n, outerLine = line;
  css = sub; i = 0; n = sub.length; line = startLineOffset - 1;
  // count newlines before each position is handled via line tracking; since sub starts right after '{', line offset is startLineOffset
  parseInto(ctx);
  css = outerCss; i = outerI; n = outerN; line = outerLine;
}

// simpler: run main parse; recursion handled inside via direct call
parseInto([]);

function normDecls(raw) {
  const noComments = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const parts = noComments.split(";").map(s => s.trim().replace(/\s+/g, " ")).filter(Boolean);
  return Array.from(new Set(parts)).sort().join("; ");
}

// group by selector+ctx, then subgroup by identical normalized decls
const clusters = new Map();
for (const r of rules) {
  const key = r.selector + "\nCTX: " + r.ctx;
  if (!clusters.has(key)) clusters.set(key, []);
  clusters.get(key).push(r);
}

const identical = [];
const partial = [];
for (const [key, list] of clusters) {
  if (list.length < 2) continue;
  const variants = new Map();
  for (const r of list) {
    const nk = normDecls(r.decls);
    if (!variants.has(nk)) variants.set(nk, []);
    variants.get(nk).push(r);
  }
  const variantArr = [...variants.values()];
  for (const group of variantArr) {
    if (group.length >= 2) {
      identical.push({ key, group, decls: normDecls(group[0].decls) });
    }
  }
  if (variantArr.length > 1) {
    partial.push({ key, variants: variantArr.map(v => v.map(r => r.start + "-" + r.end)) });
  }
}

// For each identical cluster, compute exact source ranges to remove.
// Safety: within same context, later block wins only for conflicting props;
// identical normalized decl sets => removing ALL but the LAST is cascade-equivalent
// (adjacent or not: same selector+specificity, same context, no interleaved
// conflicting rule matters because we keep the last).
// Exception: a rule between duplicates that sets the SAME property differently
// would flip final value if we removed an EARLIER duplicate that comes AFTER it.
// We detect that per selector+ctx window: any rule with same selector between
// duplicates that differs -> mark cluster unsafe.
const plan = [];
let safeCount = 0, unsafeCount = 0;
for (const item of identical) {
  const { key, group, decls } = item;
  // check for interleaved same-selector different-decls rules in same context
  const [selPart, ctxPart] = [key.split("\nCTX: ")[0], key.split("\nCTX: ")[1]];
  const siblings = rules.filter(r => r.ctx === ctxPart && r.selector === selPart);
  const sorted = [...siblings].sort((a, b) => a.start - b.start);
  let unsafe = false;
  for (let k = 1; k < sorted.length; k++) {
    const prev = sorted[k - 1], cur = sorted[k];
    // if any differing rule sits between two identical duplicates of the same group
    // i.e., a variant whose decls differ sits between two members of `group`
    const groupStarts = group.map(g => g.start);
    const minG = Math.min(...groupStarts), maxG = Math.max(...groupStarts);
    for (const s of sorted) {
      if (s.start > minG && s.start < maxG && normDecls(s.decls) !== decls && !group.includes(s)) {
        unsafe = true;
      }
    }
  }
  const remove = group.slice(0, -1); // keep last
  const keep = group[group.length - 1];
  plan.push({ selector: selPart, ctx: ctxPart, decls: decls.slice(0, 180), keep: keep.start + "-" + keep.end, remove: remove.map(r => r.start + "-" + r.end), unsafe });
  if (unsafe) unsafeCount++; else safeCount++;
}

const out = [
  "=== AUDIT V2: CONTEXT-AWARE ===",
  "rules parsed: " + rules.length,
  "identical duplicate groups: " + plan.length + " (safe: " + safeCount + ", unsafe-interleaved: " + unsafeCount + ")",
  "",
  "=== SAFE GROUPS (remove earlier, keep last) ===",
  ...plan.filter(p => !p.unsafe).map(p =>
    "[" + p.ctx + "] " + p.selector + "\n  keep " + p.keep + " | remove " + p.remove.join(", ") + "\n  decls: " + p.decls
  ),
  "",
  "=== UNSAFE GROUPS (interleaved differing rule; manual review) ===",
  ...plan.filter(p => p.unsafe).map(p =>
    "[" + p.ctx + "] " + p.selector + "\n  occurrences " + [...p.keep, ...p.remove].join(", ") + "\n  decls: " + p.decls
  ),
].join("\n");

writeFileSync("artifacts/audit-report-v2.txt", out);
console.log("identical groups:", plan.length, "| safe:", safeCount, "| unsafe:", unsafeCount);
