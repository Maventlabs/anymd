// Compile app/globals.css through the same PostCSS/Tailwind pipeline as the Next build.
// Usage: node artifacts/compile-css.mjs <output-path>
import { readFileSync, writeFileSync } from "node:fs";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";

const out = process.argv[2];
if (!out) {
  console.error("usage: node artifacts/compile-css.mjs <output-path>");
  process.exit(1);
}

const css = readFileSync("app/globals.css", "utf8");
const result = await postcss([tailwindcss()]).process(css, { from: "app/globals.css", map: false });
writeFileSync(out, result.css);
const bytes = Buffer.byteLength(result.css);
console.log("compiled:", out, "| bytes:", bytes);
