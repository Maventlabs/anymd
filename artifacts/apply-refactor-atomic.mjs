// COMBINED atomic executor. From the pristine snapshot in app/globals.css:
//   Stage A: remove dead --animate-marquee tokens + @keyframes marquee/marquee-vertical (exact strings)
//   Stage B: remove identical duplicate rules (keep LAST) + all verified dead-class rules (offset spans)
//   Stage C: trim mixed comma selector lists to live parts (re-parse on stage-B output)
// Verifications run BEFORE writing: brace balance, postcss compile, compiled-output deletions-only diff.
import { readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { gzipSync } from "node:zlib";

const DEAD = new Set([
  "hero-copy", "hero-meta", "composer-heading", "privacy-chip", "composer-toolbar",
  "composer-tools", "input-meta", "starter-prompts", "prototype-note", "slow",
  "preview-card", "preview-placeholder", "preview-browser-bar", "preview-wireframe",
  "preview-copy", "preview-title", "preview-action", "preview-visual",
  "preview-pattern-2", "preview-pattern-3", "clarification-copy", "question-example",
  "not-equal", "type-specimen", "specimen-display", "specimen-ui", "swatches",
  "privacy-icon", "theme-slot", "unavailable-skill-list", "site-signout",
  "site-mobile-signout", "showcase-route", "hero-brand", "hero-brand-logo",
  "composer-brand-mark", "hero-attribution-logo", "composer-context-note",
]);

let css = readFileSync("app/globals.css", "utf8");
const originalBytes = Buffer.byteLength(css);
const originalLines = css.split("\n").length;

// ---------- STAGE A: exact string removals (proven safe in earlier run) ----------
const exactRemovals = [
  [
    "  --animate-marquee: marquee var(--duration) infinite linear;\n  --animate-marquee-vertical: marquee-vertical var(--duration) linear infinite;\n",
    "",
  ],
  [
    "@keyframes marquee {\n  from {\n    transform: translateX(0);\n  }\n  to {\n    transform: translateX(calc(-100% - var(--gap)));\n  }\n}\n\n@keyframes marquee-vertical {\n  from {\n    transform: translateY(0);\n  }\n  to {\n    transform: translateY(calc(-100% - var(--gap)));\n  }\n}\n\n",
    "",
  ],
];
for (const [needle, rep] of exactRemovals) {
  if (!css.includes(needle)) { console.error("STAGE A: exact string not found, aborting"); process.exit(1); }
  css = css.replace(needle, rep);
}
console.log("stage A: tokens + 2 dead keyframes removed");

// ---------- STAGE B: duplicate (keep-last) + dead removal via offset parser ----------
let i = 0;
let n = css.length;
let ctxStack = [];

function skipWs() {
  while (i < n) {
    const c = css[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") i++;
    else break;
  }
}
function readUntil(chars) {
  let out = "";
  while (i < n && !chars.includes(css[i])) out += css[i++];
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
    i++;
  }
  return css.slice(start, i - 1);
}

const rules = [];
function parse() {
  while (true) {
    skipWs();
    if (i >= n) return;
    if (css[i] === "}") { i++; return; } // end of current context
    if (css.startsWith("/*", i)) {
      const idx = css.indexOf("*/", i + 2);
      i = idx === -1 ? n : idx + 2;
      continue;
    }
    if (css[i] === "@") {
      const header = readUntil("{;").trim();
      if (css[i] === ";") { i++; continue; }
      i++; // consume '{'
      if (header.startsWith("@media") || header.startsWith("@supports")) {
        ctxStack.push(header);
        parse(); // consumes body AND its closing '}'
        ctxStack.pop();
      } else {
        readBalanced();
      }
      continue;
    }
    const selStart = i;
    const selector = readUntil("{").trim();
    if (css[i] !== "{") { i = n; return; }
    i++;
    const decls = readBalanced();
    const endPos = i; // just past closing '}'
    if (selector) {
      rules.push({ selector, decls, selStart, endPos, ctx: ctxStack.join(" && ") || "(top)" });
    }
  }
}
parse();
console.log("stage B: parsed", rules.length, "rules");

function normDecls(raw) {
  const noComments = raw.replace(/\/\*[\s\S]*?\*\//g, "");
  const parts = noComments.split(";").map(s => s.trim().replace(/\s+/g, " ")).filter(Boolean);
  return Array.from(new Set(parts)).sort().join("; ");
}
function isPartFullyDead(part) {
  // A selector part can never match if ANY of its class references (outside :not())
  // targets a verified-dead class. Dead classes inside :not() invert the match and
  // are therefore NOT treated as proof of death.
  const refs = [];
  const re = /\.([A-Za-z_][A-Za-z0-9_-]+)/g;
  let m;
  while ((m = re.exec(part))) {
    // check whether this match sits inside a :not( ... ) argument
    let depth = 0, inNot = false, k = m.index;
    while (k >= 0) {
      const ch = part[k];
      if (ch === ")") depth++;
      else if (ch === "(") {
        depth--;
        if (depth === 0 && part.slice(Math.max(0, k - 4), k + 1).toLowerCase() === ":not(") inNot = true;
      }
      k--;
    }
    if (!inNot) refs.push(m[1]);
  }
  if (refs.length === 0) return false;
  return refs.some(c => DEAD.has(c));
}

const removeSpans = [];
const groups = new Map();
for (const r of rules) {
  const key = r.ctx + "\n" + r.selector + "\n" + normDecls(r.decls);
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(r);
}
let dupGroups = 0, dupBlocks = 0;
for (const [, list] of groups) {
  if (list.length < 2) continue;
  dupGroups++;
  const sorted = [...list].sort((a, b) => a.selStart - b.selStart);
  for (const r of sorted.slice(0, -1)) { removeSpans.push([r.selStart, r.endPos]); dupBlocks++; }
}
let deadBlocks = 0;
for (const r of rules) {
  const parts = r.selector.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length && parts.every(isPartFullyDead)) { removeSpans.push([r.selStart, r.endPos]); deadBlocks++; }
}
console.log("stage B: dup groups:", dupGroups, "| dup blocks removed:", dupBlocks, "| dead blocks removed:", deadBlocks);

// apply removal spans: merge ascending, then apply right-to-left, swallowing one trailing blank line
removeSpans.sort((a, b) => a[0] - b[0]);
const merged = [];
for (const [s, e] of removeSpans) {
  const last = merged[merged.length - 1];
  if (last && s <= last[1]) { last[1] = Math.max(last[1], e); }
  else merged.push([s, e]);
}
for (let k = merged.length - 1; k >= 0; k--) {
  let [s, e] = merged[k];
  let e2 = e;
  while (e2 < css.length && " \t".includes(css[e2])) e2++;
  if (css[e2] === "\r") e2++;
  if (css[e2] === "\n") e2++;
  css = css.slice(0, s) + css.slice(e2);
}
css = css.replace(/\n{3,}/g, "\n\n");

// ---------- STAGE C: trim mixed comma lists (re-parse on stage-B output) ----------
i = 0; n = css.length; ctxStack = [];
const mixedRules = [];
function parse2() {
  while (true) {
    skipWs();
    if (i >= n) return;
    if (css[i] === "}") { i++; return; }
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
        parse2();
      } else {
        readBalanced();
      }
      continue;
    }
    const selStart = i;
    const selector = readUntil("{").trim();
    if (css[i] !== "{") { i = n; return; }
    const bracePos = i;
    i++;
    readBalanced();
    if (selector) {
      const parts = selector.split(",").map(s => s.trim()).filter(Boolean);
      const anyDead = parts.some(isPartFullyDead);
      const allDead = parts.every(isPartFullyDead);
      if (anyDead && !allDead) {
        mixedRules.push([selStart, bracePos, parts.filter(p => !isPartFullyDead(p)).join(",\n")]);
      }
    }
  }
}
parse2();
console.log("stage C: mixed lists found:", mixedRules.length, "(kept as-is — trimming could introduce NEW (selector, decls) pairs)");
for (const [, , rep] of mixedRules) console.log("  kept:", rep.slice(0, 70));
// SECURITY: trimming a mixed comma list rewrites a rule into a NEW (live-selector, decls)
// pair that never existed in the original — that CAN change rendering (verified: the
// deletions-only gate rejected it). Mixed lists stay untouched; dead parts simply never match.

// ---------- VERIFICATIONS (before write) ----------
let depth = 0, balanced = true;
for (let p = 0; p < css.length; p++) {
  if (css.startsWith("/*", p)) { const e2 = css.indexOf("*/", p + 2); p = e2 === -1 ? css.length : e2 + 1; continue; }
  if (css[p] === "{") depth++;
  else if (css[p] === "}") { depth--; if (depth < 0) { balanced = false; break; } }
}
if (!balanced || depth !== 0) { console.error("VERIFY FAIL: brace balance", depth); process.exit(1); }
console.log("verify: brace balance OK");

// dead gate: no rule in the final CSS may consist ONLY of fully-dead parts.
// Occurrences of dead classes inside MIXED comma lists are intentional: those parts
// never match (no DOM element carries them) and trimming them would create new pairs.
{
  let j = 0; const m2 = css.length; const saved = { i, n };
  i = j; n = m2; ctxStack = [];
  let badRule = null;
  const scanDead = () => {
    while (true) {
      skipWs();
      if (i >= n) return;
      if (css[i] === "}") { i++; return; }
      if (css.startsWith("/*", i)) { const idx = css.indexOf("*/", i + 2); i = idx === -1 ? n : idx + 2; continue; }
      if (css[i] === "@") {
        const header = readUntil("{;").trim();
        if (css[i] === ";") { i++; continue; }
        i++;
        if (header.startsWith("@media") || header.startsWith("@supports")) scanDead(); else readBalanced();
        continue;
      }
      const selector = readUntil("{").trim();
      if (css[i] !== "{") { i = n; return; }
      i++;
      readBalanced();
      if (selector) {
        const parts = selector.split(",").map(s => s.trim()).filter(Boolean);
        if (parts.length && parts.every(isPartFullyDead)) { badRule = selector; return; }
      }
    }
  };
  scanDead();
  i = saved.i; n = saved.n;
  if (badRule) { console.error("VERIFY FAIL: fully-dead rule remains:", badRule.slice(0, 80)); process.exit(1); }
}
console.log("verify: no fully-dead rules remain (mixed-list dead parts are intentional no-matches)");

const beforeCompiled = (await postcss([tailwindcss()]).process(readFileSync("app/globals.css", "utf8"), { from: "app/globals.css", map: false })).css;
const afterCompiled = (await postcss([tailwindcss()]).process(css, { from: "app/globals.css", map: false })).css;

// deletions-only check: every compiled line in 'after' must exist in 'before' with >= count
const countLines = t => { const m = new Map(); for (const l of t.split("\n")) m.set(l, (m.get(l) ?? 0) + 1); return m; };
const beforeMap = countLines(beforeCompiled);
const afterMap = countLines(afterCompiled);
const added = [];
for (const [l, c] of afterMap) {
  if ((beforeMap.get(l) ?? 0) < c) added.push(l);
}
if (added.length) { console.error("VERIFY FAIL: compiled output contains ADDED lines:", added.slice(0, 10)); process.exit(1); }
console.log("verify: compiled output is deletions-only (no added/modified lines)");

// sanity gate: this refactor must remove ONLY duplicates/dead/keyframes (~21k compiled bytes),
// not wipe whole regions. Fail loudly if compiled output shrinks beyond the plausible band.
const shrinkRatio = afterCompiled.length / beforeCompiled.length;
if (shrinkRatio < 0.8) { console.error("VERIFY FAIL: compiled CSS shrank to " + (shrinkRatio * 100).toFixed(1) + "% — mass over-deletion, refusing to write"); process.exit(1); }
if (css.split("\n").length < 5000) { console.error("VERIFY FAIL: source line count implausible (<5000)"); process.exit(1); }
console.log("verify: shrink ratio " + (shrinkRatio * 100).toFixed(1) + "% within plausible band");

// containment gate: every (ctx, selector, decls) surviving must have existed in the original
const sig = r => r.ctx + "\n" + r.selector + "\n" + normDecls(r.decls);
const beforeSigCount = new Map();
for (const r of rules) beforeSigCount.set(sig(r), (beforeSigCount.get(sig(r)) ?? 0) + 1);
const afterRules = [];
{
  let j = 0; const m2 = css.length; const saved = { i, n };
  i = j; n = m2; ctxStack = [];
  const collect = () => {
    while (true) {
      skipWs();
      if (i >= n) return;
      if (css[i] === "}") { i++; return; }
      if (css.startsWith("/*", i)) { const idx = css.indexOf("*/", i + 2); i = idx === -1 ? n : idx + 2; continue; }
      if (css[i] === "@") {
        const header = readUntil("{;").trim();
        if (css[i] === ";") { i++; continue; }
        i++;
        if (header.startsWith("@media") || header.startsWith("@supports")) { ctxStack.push(header); collect(); ctxStack.pop(); } else readBalanced();
        continue;
      }
      const selector = readUntil("{").trim();
      if (css[i] !== "{") { i = n; return; }
      i++;
      const decls = readBalanced();
      if (selector) afterRules.push({ selector, decls, ctx: ctxStack.join(" && ") || "(top)" });
    }
  };
  collect();
  i = saved.i; n = saved.n;
}
const afterSigCount = new Map();
for (const r of afterRules) afterSigCount.set(sig(r), (afterSigCount.get(sig(r)) ?? 0) + 1);
const escaped = [];
for (const [s2, c] of afterSigCount) {
  if ((beforeSigCount.get(s2) ?? 0) < c) escaped.push(s2.split("\n")[1]);
}
if (escaped.length) { console.error("VERIFY FAIL: rules not present in original source:", escaped.slice(0, 5)); process.exit(1); }
console.log("verify: all surviving rules exist in original source (containment OK)");

// ---------- WRITE ----------
writeFileSync("app/globals.css", css);
writeFileSync("artifacts/globals.after.compiled.css", afterCompiled);
writeFileSync("artifacts/globals.before.compiled.css", beforeCompiled);

const gz = gzipSync(Buffer.from(afterCompiled), { level: 9 }).length;
const gzBefore = gzipSync(Buffer.from(beforeCompiled), { level: 9 }).length;
console.log("");
console.log("=== RESULT ===");
console.log("source:", originalBytes, "->", Buffer.byteLength(css), "bytes |", originalLines, "->", css.split("\n").length, "lines");
console.log("compiled:", beforeCompiled.length, "->", afterCompiled.length, "bytes | gzip:", gzBefore, "->", gz);
