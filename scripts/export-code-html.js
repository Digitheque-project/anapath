const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'anapath-code-export.html');

const EXCLUDE_DIRS = new Set(['node_modules', '.next', 'dist', '.git', 'coverage', '.cursor', 'scripts']);
const EXCLUDE_FILES = new Set(['package-lock.json', 'anapath-code-export.html']);
const INCLUDE_EXT = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.json', '.yaml', '.yml', '.md']);

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) walk(full, files);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (INCLUDE_EXT.has(ext) && !EXCLUDE_FILES.has(entry.name)) {
        files.push(path.relative(ROOT, full).split(path.sep).join('/'));
      }
    }
  }
  return files.sort();
}

const files = walk(ROOT);
const toc = [];
const sections = [];

for (const rel of files) {
  const fullPath = path.join(ROOT, ...rel.split('/'));
  let content;
  try {
    content = fs.readFileSync(fullPath, 'utf8');
  } catch {
    continue;
  }

  const id = rel.replace(/[^a-zA-Z0-9]/g, '-');
  const lines = content.split('\n').length;
  toc.push(
    `<li><a href="#${id}">${escapeHtml(rel)}</a> <span class="meta">(${lines} lignes)</span></li>`,
  );
  sections.push(`<section id="${id}" class="file">
<h2><code>${escapeHtml(rel)}</code></h2>
<pre><code>${escapeHtml(content)}</code></pre>
</section>`);
}

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Anapath - Export du code source</title>
<style>
:root{--bg:#0f172a;--panel:#1e293b;--text:#e2e8f0;--muted:#94a3b8;--accent:#38bdf8;--border:#334155}
*{box-sizing:border-box}
body{margin:0;font-family:Segoe UI,system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.5}
header{padding:1.5rem 2rem;background:var(--panel);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}
header h1{margin:0 0 .25rem;font-size:1.5rem}
header p{margin:0;color:var(--muted)}
.layout{display:grid;grid-template-columns:320px 1fr;min-height:calc(100vh - 90px)}
nav{background:var(--panel);border-right:1px solid var(--border);padding:1rem;overflow:auto;max-height:calc(100vh - 90px);position:sticky;top:90px}
nav h2{font-size:.9rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:0 0 .75rem}
nav ul{list-style:none;padding:0;margin:0}
nav li{margin:.35rem 0;font-size:.85rem}
nav a{color:var(--accent);text-decoration:none}
nav a:hover{text-decoration:underline}
.meta{color:var(--muted);font-size:.75rem}
main{padding:1.5rem 2rem;overflow:auto}
.file{margin-bottom:2.5rem;padding-bottom:1.5rem;border-bottom:1px solid var(--border)}
.file h2{font-size:1rem;margin:0 0 .75rem;color:var(--accent)}
pre{margin:0;padding:1rem;background:#020617;border:1px solid var(--border);border-radius:8px;overflow:auto;font-size:.78rem;line-height:1.45;white-space:pre-wrap;word-break:break-word}
code{font-family:Consolas,Monaco,monospace}
@media(max-width:900px){.layout{grid-template-columns:1fr}nav{position:static;max-height:none}}
</style>
</head>
<body>
<header>
<h1>Projet Anapath - Export du code</h1>
<p>${files.length} fichiers | Généré le ${new Date().toLocaleString('fr-FR')}</p>
</header>
<div class="layout">
<nav><h2>Table des matières</h2><ul>
${toc.join('\n')}
</ul></nav>
<main>
${sections.join('\n')}
</main>
</div>
</body>
</html>`;

fs.writeFileSync(OUT, html, 'utf8');
console.log(`Created: ${OUT}`);
console.log(`Files: ${files.length}`);
