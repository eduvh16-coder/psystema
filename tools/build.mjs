// Psystema — build: compiles the app into plain files ready to publish (no in-browser compiling).
// Usage: node build.mjs [path-to-app-sources]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require = createRequire("/opt/npm-tools/node_modules/");
const esbuild = require("esbuild");
const acorn = require("/opt/node-tools/node_modules/acorn");
const { chromium } = createRequire(import.meta.url)("playwright");

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const APPSRC = process.argv[2] || path.join(ROOT, "src/app");
const DIST = path.join(ROOT, "dist");
const V = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, "icons"), { recursive: true });

// 1) app code: JSX -> JS, top-level const/let -> var (the files share one global scope), concatenated + minified
const ORDER = [
  path.join(ROOT, "src/cloud.jsx"), path.join(ROOT, "src/tweaks-stub.js"),
  ...["data", "icons", "gcal", "ui", "session", "modals", "docs", "extras", "views1", "views2", "app"].map((f) => path.join(APPSRC, f + ".jsx")),
];
let bundle = "";
for (const file of ORDER) {
  const src = fs.readFileSync(file, "utf8");
  const out = esbuild.transformSync(src, { loader: "jsx", jsx: "transform", target: ["es2020"], sourcefile: path.basename(file) }).code;
  const ast = acorn.parse(out, { ecmaVersion: "latest", sourceType: "script" });
  const edits = ast.body.filter((n) => n.type === "VariableDeclaration" && n.kind !== "var").map((n) => [n.start, n.kind.length]);
  let code = out;
  for (const [start, len] of edits.reverse()) code = code.slice(0, start) + "var" + code.slice(start + len);
  bundle += `\n/* ${path.basename(file)} */\n${code}\n;`;
}
const app = esbuild.transformSync(bundle, { minify: true, target: ["es2020"], legalComments: "none" }).code;
fs.writeFileSync(path.join(DIST, "app.js"), app);

// 2) vendor: React (production) bundled locally
await esbuild.build({
  stdin: { contents: `import * as React from "react"; import * as ReactDOM from "react-dom"; import * as Client from "react-dom/client"; window.React = React; window.ReactDOM = Object.assign({}, ReactDOM, Client);`, resolveDir: "/opt/npm-tools/node_modules", loader: "js" },
  bundle: true, minify: true, format: "iife", target: ["es2020"], define: { "process.env.NODE_ENV": '"production"' }, outfile: path.join(DIST, "vendor.js"), legalComments: "none",
});

// 3) CSS: Tailwind 3.4.17 (same engine the canvas uses), generated once from every class in the source
const classes = new Set();
for (const file of ORDER) {
  const src = fs.readFileSync(file, "utf8");
  for (const m of src.matchAll(/(["'`])((?:(?!\1)[^\\\n]|\\.)*)\1/g)) m[2].split(/\s+/).forEach((t) => { if (/^[!-~]+$/.test(t) && t.length < 80 && !/[{}$]/.test(t)) classes.add(t); });
}
const TW = fs.readFileSync("/opt/npm-tools/node_modules/@zenuml/core/dist/vendor/tailwindcss/tailwindcss.js", "utf8");
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<!doctype html><html><head></head><body><div id="c"></div></body></html>`);
await page.addScriptTag({ content: TW });
await page.evaluate((cls) => { const d = document.getElementById("c"); d.className = cls.join(" "); }, [...classes]);
await page.waitForTimeout(1500);
const css = await page.evaluate(() => Array.from(document.querySelectorAll("style")).map((s) => s.textContent).join("\n"));
await browser.close();
if (css.length < 5000) throw new Error("Tailwind CSS looks empty");
const cssMin = esbuild.transformSync(css + "\nbutton:not(:disabled),[role=button]{cursor:pointer}", { loader: "css", minify: true, target: ["es2020"] }).code;
fs.writeFileSync(path.join(DIST, "app.css"), cssMin);

// 4) static files
const LOGO = fs.readFileSync(path.join(ROOT, "assets/logo.svg"), "utf8");
const paths = (LOGO.match(/<path[^>]*>(<\/path>)?/g) || []).join("");
const boot = `<svg width="46" height="46" viewBox="76 72 152 156" fill="#3D6FF6" opacity=".35">${paths}</svg>`;
for (const f of ["index.html", "sw.js", "manifest.webmanifest", "config.js", "_headers"]) {
  const p = path.join(ROOT, "web", f); if (!fs.existsSync(p)) continue;
  let t = fs.readFileSync(p, "utf8").replaceAll("__V__", V).replace("__BOOTLOGO__", boot);
  fs.writeFileSync(path.join(DIST, f), t);
}
for (const f of fs.readdirSync(path.join(ROOT, "icons"))) fs.copyFileSync(path.join(ROOT, "icons", f), path.join(DIST, "icons", f));
console.log("built", V, { app: app.length, css: cssMin.length, classes: classes.size });
