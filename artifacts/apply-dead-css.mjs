// Batch 2 executor: remove rules for verified dead classes (zero source references).
// For selectors that are comma lists, drop only the dead parts; keep live parts.
// Refuses to touch anything not in the verified DEAD list (dynamic classes like
// nav-item-* / preloader-tile-* are NOT here on purpose).
import { readFileSync, writeFileSync } from "node:fs";

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
const n0 = css.length;

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

// Collect top-level (and media-nested) ranges to remove.
// classesInSelector(sel): true if EVERY comma part references at least one dead class
// AND no other class is live. We remove the rule only when all parts are fully dead;
// partial lists (mixed dead+live) are rewritten instead.
const ranges = [];
const rewrites = [];

function isPartFullyDead(part) {
  const classes = [...part.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]+)/g)].map(m => m[1]);
  if (classes.length === 0) return false; // pure element/pseudo selector: never dead here
  return classes.every(c => DEAD.has(c));
}

function parse(ctxStartLine, depthCtx) {
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
        parse(bodyLineStart, depthCtx + 1);
        css = outer.css; i = outer.i; n = outer.n; line = outer.line;
      } else {
        readBalanced();
      }
      continue;
    }
    const selStart = i - (css.slice(0, i).length - css.slice(0, i).replace(/^\s*[\r\n]+/, "").length); // not used, computed below
    const selector = readUntil("{").trim();
    const selLineStart = line;
    if (css[i] !== "{") break;
    i++;
    const declsStart = i;
    const decls = readBalanced();
    const endLine = line;

    if (!selector) continue;

    // split comma parts (top-level commas only; our selectors have no nested parens with commas except :not(...) — handle by naive split then check)
    const parts = selector.split(",").map(s => s.trim()).filter(Boolean);
    const partStatus = parts.map(p => ({ p, dead: isPartFullyDead(p) }));
    const allDead = partStatus.every(x => x.dead);
    const anyDead = partStatus.some(x => x.dead);

    if (allDead) {
      ranges.push([startLine, endLine]);
    } else if (anyDead) {
      // mixed list: keep only live parts
      const liveParts = partStatus.filter(x => !x.dead).map(x => x.p);
      rewrites.push({ selector, liveParts, startLine, endLine, decls });
    }
    void selStart; void declsStart; void selLineStart;
  }
}
parse(1, 0);

console.log("rules fully dead:", ranges.length, "| mixed lists to trim:", rewrites.length);
for (const r of rewrites) console.log("  trim:", r.selector.slice(0, 80), "=> keep", r.liveParts.join(", ").slice(0, 60));

// Apply rewrites first (replace selector lines), then removals by line filter.
const lines = css.split(/\r?\n/);
const kill = new Array(lines.length).fill(false);

for (const rw of rewrites) {
  // find the selector start line by matching the selector text
  for (let k = 0; k < lines.length; k++) {
    if (lines[k].trim() === rw.selector || lines[k].includes(rw.liveParts.join(","))) {
      // rebuild selector starting at line k
      // collect lines until one ends with '{'
      let end = k;
      while (end < lines.length && !lines[end].includes("{")) end++;
      if (end >= lines.length) break;
      const newSelector = rw.liveParts.join(",\n");
      lines[k] = newSelector;
      for (let m = k + 1; m <= end; m++) kill[m] = true;
      break;
    }
  }
}

for (const [s, e] of ranges.map(([a, b]) => {
  const after = b + 1;
  if (after <= lines.length && lines[after - 1] !== undefined && lines[after - 1].trim() === "") return [a, b + 1];
  return [a, b];
})) {
  for (let k = s; k <= e; k++) kill[k - 1] = true;
}

const result = lines.filter((_, idx) => !kill[idx]).join("\n");
writeFileSync("app/globals.css", result);
console.log("bytes:", n0, "->", result.length, "| lines:", result.split(/\r?\n/).length);
