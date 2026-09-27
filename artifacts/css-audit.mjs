import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");

// 1. Collect used class names + ids from source (tsx/ts/e2e + query strings).
function collectFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectFiles(full, out);
    } else if ([".tsx", ".ts"].includes(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

const roots = ["app", "components", "lib", "e2e"].map((dir) =>
  join(root, dir)
);
const files = roots.flatMap((dir) => collectFiles(dir));

const usedClasses = new Set();
const usedIds = new Set();
const JS_RESERVED = new Set([
  "true", "false", "null", "undefined", "void", "typeof", "new", "delete",
  "in", "of", "instanceof", "as", "from", "import", "export", "default",
  "return", "if", "else", "for", "while", "switch", "case", "break",
  "continue", "function", "class", "extends", "this", "super", "try",
  "catch", "finally", "throw", "async", "await", "yield", "const", "let",
  "var", "static", "get", "set",
]);

function addToken(token) {
  const clean = token.replace(/^[."':]+|[."':]+$/g, "").split(":").pop();
  if (/^[A-Za-z_-][\w-]*$/.test(clean) && !JS_RESERVED.has(clean)) {
    usedClasses.add(clean);
  }
}

// read a balanced { ... } or ( ... ) span starting at src[start]
function readBalanced(src, start, open, close) {
  let depth = 0;
  let quote = null;
  for (let i = start; i < src.length; i += 1) {
    const char = src[i];
    if (quote) {
      if (char === "\\") {
        i += 1;
      } else if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'" || char === "`") {
      quote = char;
    } else if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) return src.slice(start + 1, i);
    }
  }
  return "";
}

function harvestStrings(segment) {
  // quoted fragments: "..." '...' (keep every word, they may be classes)
  for (const match of segment.matchAll(/"([^"]*)"|'([^']*)'/g)) {
    const content = (match[1] ?? match[2] ?? "").replace(/\$\{[^}]*\}/g, " ");
    for (const token of content.split(/\s+/)) addToken(token);
  }
  // backtick raw text outside ${ ... }
  for (const match of segment.matchAll(/`((?:[^`\\]|\\.)*)`/g)) {
    const content = match[1].replace(/\$\{[^}]*\}/g, " ");
    for (const token of content.split(/\s+/)) addToken(token);
  }
}

function harvestClassAttributes(src) {
  let index = 0;
  while (true) {
    const at = src.indexOf("className=", index);
    if (at === -1) break;
    let cursor = at + "className=".length;
    while (src[cursor] === " ") cursor += 1;
    const lead = src[cursor];
    if (lead === '"' || lead === "'") {
      const end = src.indexOf(lead, cursor + 1);
      if (end === -1) break;
      harvestStrings(src.slice(cursor, end + 1));
      index = end + 1;
    } else if (lead === "{") {
      const inner = readBalanced(src, cursor, "{", "}");
      harvestStrings(inner);
      index = cursor + inner.length + 2;
    } else {
      index = cursor + 1;
    }
  }
  index = 0;
  while (true) {
    const at = src.indexOf("cn(", index);
    if (at === -1) break;
    const inner = readBalanced(src, at + 2, "(", ")");
    harvestStrings(inner);
    index = at + inner.length + 3;
  }
}
const quoted = /["'`]([^"'`]*?)["'`]/g;
const idAttr = /id=(["'])([\s\S]*?)\1/g;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  harvestClassAttributes(src);
  // spans of `...` template literals, so "quoted" fragments inside them
  // (e.g. a ternary class like "pricing-card-featured") count as templates
  const templateSpans = [];
  {
    const templateRe = /`(?:[^`\\]|\\.)*`/g;
    for (const match of src.matchAll(templateRe)) {
      templateSpans.push([match.index, match.index + match[0].length]);
    }
  }
  const inTemplate = (index) =>
    templateSpans.some(([start, end]) => index >= start && index < end);

  for (const match of src.matchAll(quoted)) {
    const isTemplate =
      match[0].startsWith("`") || inTemplate(match.index ?? 0);
    let content = match[1];
    if (isTemplate) content = content.replace(/\$\{[^}]*\}/g, " ");
    for (const part of content.split(/\s+/)) {
      if (/^[.#][A-Za-z_-][\w-]*$/.test(part)) {
        if (part.startsWith(".")) usedClasses.add(part.slice(1));
        else usedIds.add(part.slice(1));
      } else if (isTemplate && /^[A-Za-z_-][\w-]*-[\w-]+$/.test(part)) {
        // bare kebab-case token inside a template string, e.g. a ternary
        // class fragment like "pricing-card-featured"
        usedClasses.add(part);
      }
    }
  }
  for (const match of src.matchAll(idAttr)) {
    if (/^[A-Za-z_-][\w-]*$/.test(match[2])) usedIds.add(match[2]);
  }
}

// Runtime-added classes (JS libraries, not present in markup).
for (const name of ["split-word", "split-parent"]) usedClasses.add(name);

// 2. Parse CSS into flat rules with media context.
function stripComments(input) {
  return input.replace(/\/\*[\s\S]*?\*\//g, "");
}

function parseRules(input, media = "") {
  const rules = [];
  let depth = 0;
  let selectorStart = 0;
  let bodyStart = 0;
  let selector = "";
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "{") {
      if (depth === 0) {
        selector = input.slice(selectorStart, i).trim();
        bodyStart = i + 1;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        const body = input.slice(bodyStart, i);
        if (selector.startsWith("@media")) {
          rules.push(...parseRules(body, selector));
        } else if (
          !selector.startsWith("@keyframes") &&
          !selector.startsWith("@theme") &&
          !selector.startsWith("@custom-variant") &&
          !selector.startsWith("@import") &&
          !selector.startsWith("@charset") &&
          selector !== ""
        ) {
          rules.push({ selector, body, media });
        } else if (selector !== "") {
          rules.push({ selector, body, media, keep: true });
        }
        selectorStart = i + 1;
      }
    }
  }
  return rules;
}

const rules = parseRules(stripComments(css));

const ELEMENTS = new Set([
  "a", "abbr", "article", "aside", "blockquote", "body", "button", "caption",
  "code", "details", "dialog", "div", "em", "fieldset", "figcaption", "figure",
  "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "html",
  "img", "input", "label", "legend", "li", "main", "nav", "ol", "p", "pre",
  "section", "select", "small", "span", "strong", "summary", "table", "tbody",
  "td", "textarea", "th", "thead", "tr", "ul", "video",
]);

function selectorClasses(selector) {
  const names = new Set();
  for (const match of selector.matchAll(/\.([A-Za-z_-][\w-]*)/g)) {
    names.add(match[1]);
  }
  return [...names];
}

function selectorIds(selector) {
  const names = new Set();
  for (const match of selector.matchAll(/#([A-Za-z_-][\w-]*)/g)) {
    names.add(match[1]);
  }
  return [...names];
}

function hasBareElement(selector) {
  const cleaned = selector
    .replace(/\[[^\]]*\]/g, "")
    .replace(/::?[a-zA-Z-]+(\([^)]*\))?/g, "")
    .replace(/[.#][A-Za-z_-][\w-]*/g, "")
    .replace(/[>+~*,]/g, " ");
  return cleaned.split(/\s+/).some((token) => ELEMENTS.has(token.toLowerCase()));
}

const dead = [];
const live = [];
for (const rule of rules) {
  if (rule.keep) {
    live.push(rule);
    continue;
  }
  const classes = selectorClasses(rule.selector);
  const ids = selectorIds(rule.selector);
  const anyClassUsed = classes.some((name) => usedClasses.has(name));
  const anyIdUsed = ids.some((name) => usedIds.has(name));
  if (classes.length === 0 && ids.length === 0) {
    live.push(rule); // element-only or attribute-only selectors: keep
  } else if (anyClassUsed || anyIdUsed || hasBareElement(rule.selector)) {
    live.push(rule);
  } else {
    dead.push(rule);
  }
}

// 3. Duplicates among live rules.
const seen = new Map();
const dupes = [];
for (const rule of live) {
  const key = `${rule.media}|||${rule.selector.replace(/\s+/g, " ")}`;
  const normBody = rule.body.replace(/\s+/g, " ").trim();
  if (!seen.has(key)) {
    seen.set(key, [{ body: normBody }]);
  } else {
    const group = seen.get(key);
    if (group.some((entry) => entry.body === normBody)) {
      dupes.push(rule);
    } else {
      group.push({ body: normBody });
    }
  }
}

const report = {
  totalRules: rules.length,
  deadCount: dead.length,
  dupeCount: dupes.length,
  dead,
  dupes: dupes.map((rule) => ({ selector: rule.selector, media: rule.media })),
  dupeKeys: dupes.map(
    (rule) =>
      `${rule.media}|||${rule.selector.replace(/\s+/g, " ")}|||${rule.body.replace(/\s+/g, " ").trim()}`
  ),
};
writeFileSync(
  new URL("./css-audit-report.json", import.meta.url),
  JSON.stringify(report, null, 2)
);
console.log(`rules=${rules.length} dead=${dead.length} identical-dupes=${dupes.length}`);
console.log("--- DEAD (first 80) ---");
for (const rule of dead.slice(0, 80)) {
  console.log(`${rule.media ? `${rule.media} ` : ""}${rule.selector}`);
}
