// scripts/postbuild-404.cjs
// копируем index.html → 404.html для GitHub Pages SPA fallback
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
const src = path.join(dist, "index.html");
const dest = path.join(dist, "404.html");

if (fs.existsSync(src)) {
  fs.copyFileSync(src, dest);
  console.log("SPA fallback created: dist/404.html");
} else {
  console.error("index.html not found in dist/");
  process.exit(1);
}
