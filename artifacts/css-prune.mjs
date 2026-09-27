import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const cssPath = join(root, "app", "globals.css");
const report = JSON.parse(
  readFileSync(join(root, "artifacts", "css-audit-report.json"), "utf8")
);

// Tokenize original CSS with positions (comment-aware), one @media level.
function tokenize(input) {
  const rules = [];
  let depth = 0;
  let selectorStart = 0;
  let bodyStart = 0;
  let selector = "";
  let i = 0;
  while (i < input.length) {
    if (input.startsWith("/*", i)) {
      const end = input.indexOf("*/", i + 2);
      i = end === -1 ? input.length : end + 2;
      if (depth === 0) selectorStart = i;
      continue;
    }
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
        if (selector.startsWith("@media")) {
          rules.push(...tokenizeInner(input, bodyStart, i, selector));
        } else {
          rules.push({
            selector,
            body: input.slice(bodyStart, i),
            media: "",
            start: selectorStart,
            end: i + 1,
          });
        }
        selectorStart = i + 1;
      }
    }
    i += 1;
  }
  return rules;
}

function tokenizeInner(input, from, to, media) {
  const rules = [];
  let depth = 0;
  let selectorStart = from;
  let bodyStart = 0;
  let selector = "";
  let i = from;
  while (i < to) {
    if (input.startsWith("/*", i)) {
      const end = input.indexOf("*/", i + 2);
      i = end === -1 ? to : end + 2;
      if (depth === 0) selectorStart = i;
      continue;
    }
    const char = input[i];
    if (char === "{") {
      if (depth === 0) {
        selector = input.slice(selectorStart, i).trim();
        bodyStart = i + 1;
      }
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0 && !selector.startsWith("@")) {
        rules.push({ selector, body: input.slice(bodyStart, i), media, start: selectorStart, end: i + 1 });
      }
      selectorStart = i + 1;
    }
    i += 1;
  }
  return rules;
}

const css = readFileSync(cssPath, "utf8");
const rules = tokenize(css);

const deadKeys = new Set(
  report.dead.map(
    (rule) => `${rule.media}|||${rule.selector.replace(/\s+/g, " ")}`
  )
);
const dupeKeys = new Set(
  (report.dupeKeys ?? []).map((key) => key)
);

const seen = new Set();
const toDelete = [];
for (const rule of rules) {
  if (
    rule.selector.startsWith("@keyframes") ||
    rule.selector.startsWith("@theme") ||
    rule.selector.startsWith("@custom-variant") ||
    rule.selector === ""
  ) {
    continue;
  }
  const key = `${rule.media}|||${rule.selector.replace(/\s+/g, " ")}`;
  const normBody = rule.body.replace(/\s+/g, " ").trim();
  if (deadKeys.has(key)) {
    toDelete.push(rule);
    continue;
  }
  const dupKey = `${key}|||${normBody}`;
  if (dupeKeys.has(dupKey)) {
    if (seen.has(dupKey)) toDelete.push(rule);
    else seen.add(dupKey);
  }
}

toDelete.sort((a, b) => b.start - a.start);
let out = css;
for (const rule of toDelete) {
  out = out.slice(0, rule.start) + out.slice(rule.end);
}
// drop @media blocks left empty
let previous = "";
while (previous !== out) {
  previous = out;
  out = out.replace(/@media[^{]+\{\s*\}/g, "");
}
writeFileSync(cssPath, out);
console.log(`deleted=${toDelete.length} bytes=${css.length}->${out.length}`);
