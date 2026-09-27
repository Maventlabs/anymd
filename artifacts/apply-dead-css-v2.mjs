// Batch 2 executor (v2, offset-based): remove rules for verified dead classes.
// Single-pass parser over the whole stylesheet with a context stack, tracking exact
// character offsets. Full-dead rules are removed by span; mixed comma lists keep only
// their live parts (the '{' is never touched). Cannot unbalance braces by construction.
import { readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

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

function isPartFullyDead(part) {
  const classes = [...part.matchAll(/\.([A-Za-z_][A-Za-z0-9_-]+)/g)].map(m => m[1]);
  if (classes.length === 0) return false;
  return classes.every(c => DEAD.has(c));
}

// span: [start, end) character offsets to delete; selectorEdits: [start, end, replacement]
const spans = [];
const selectorEdits = [];

function parse() {
  while (i < n) {
    skipWs();
    if (i >= n) break;
    if (css.startsWith("/*", i)) {
      const idx = css.indexOf("*/", i + 2);
      i = idx === -1 ? n : idx + 2;
      continue;
    }
    if (css[i] === "@") {
      const headerStart = i;
      const header = readUntil("{;").trim();
      if (css[i] === ";") { i++; continue; }
      i++; // consume '{'
      if (header.startsWith("@media") || header.startsWith("@supports")) {
        const innerStart = i;
        parse(); // recurse; parser stops at the matching '}'
        // i now points just past the closing '}' of this media block
        // (readBalanced not used here; recursion consumed the body)
        continue;
      } else {
        readBalanced();
      }
      continue;
    }
    // rule: selector { decls }
    const selStart = i;
    const selector = readUntil("{").trim();
    if (css[i] !== "{") break;
    const bracePos = i;
    i++;
    const decls = readBalanced();
    const endPos = i; // just past closing '}'
    if (!selector) continue;

    const parts = selector.split(",").map(s => s.trim()).filter(Boolean);
    const statuses = parts.map(p => ({ p, dead: isPartFullyDead(p) }));
    const allDead = statuses.every(x => x.dead);
    const anyDead = statuses.some(x => x.dead);

    if (allDead) {
      // remove whole rule span: from selStart (approx: include preceding ws via later cleanup) to endPos
      spans.push([selStart, endPos]);
    } else if (anyDead) {
      const liveParts = statuses.filter(x => !x.dead).map(x => x.p);
      selectorEdits.push([selStart, bracePos, liveParts.join(",\n")]);
    }
  }
}
parse();

console.log("full-dead rules:", spans.length, "| mixed lists trimmed:", selectorEdits.length);
for (const [, , rep] of selectorEdits) console.log("  trim =>", rep.slice(0, 70));

// Apply selector edits right-to-left (they never overlap removal spans)
selectorEdits.sort((a, b) => b[0] - a[0]);
for (const [s, e, rep] of selectorEdits) css = css.slice(0, s) + rep + css.slice(e);

// Apply removal spans right-to-left, expanding each by one trailing newline+indent
spans.sort((a, b) => b[0] - a[0]);
for (let k = 0; k < spans.length; k++) {
  let [s, e] = spans[k];
  // swallow following blank line if present
  let e2 = e;
  while (e2 < css.length && (css[e2] === "\n" || css[e2] === "\r" || css[e2] === " " || css[e2] === "\t")) {
    e2++;
    if (css[e2 - 1] === "\n") break; // stop after one newline
  }
  css = css.slice(0, s) + css.slice(e2);
}

// trailing blank-line collapse: turn 3+ consecutive newlines into 2
css = css.replace(/\n{3,}/g, "\n\n");

writeFileSync("app/globals.css", css);

// built-in verification: brace balance + postcss compile
let depth = 0, ok = true;
for (let p = 0; p < css.length; p++) {
  if (css.startsWith("/*", p)) { const e2 = css.indexOf("*/", p + 2); p = e2 === -1 ? css.length : e2 + 1; continue; }
  if (css[p] === "{") depth++;
  else if (css[p] === "}") { depth--; if (depth < 0) { ok = false; break; } }
}
console.log("brace balance:", depth === 0 && ok ? "OK" : "BROKEN (" + depth + ")");
if (depth !== 0) process.exit(1);

const result = await postcss([tailwindcss()]).process(css, { from: "app/globals.css", map: false });
writeFileSync("artifacts/globals.step2.compiled.css", result.css);
console.log("compiled OK:", result.css.length, "bytes | source:", css.length, "->", n0, "bytes |", css.split("\n").length, "lines");
