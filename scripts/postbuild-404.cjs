// scripts/postbuild-404.cjs
// Любой deep-link /something на GitHub Pages -> мгновенный редирект на /#/something
const fs = require("fs");
const path = require("path");

const dist = path.join(__dirname, "..", "dist");
if (!fs.existsSync(dist)) fs.mkdirSync(dist, { recursive: true });

const html = `<!doctype html><meta charset="utf-8">
<title>Redirecting…</title>
<meta name="robots" content="noindex">
<script>
  (function () {
    // если уже на hash, ничего не делаем
    if (location.hash) return;
    var p = location.pathname.replace(/^\\//,''); // lab, docs/x, ...
    var q = location.search || '';
    var h = location.hash || '';
    location.replace('/#/' + p + q + h);
  })();
</script>
<p>Redirecting…</p>`;
fs.writeFileSync(path.join(dist, "404.html"), html);
console.log("Created dist/404.html redirect -> /#/<path>");
