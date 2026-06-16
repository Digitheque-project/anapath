#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outFile = path.join(root, 'all_code_dump.html');
const exclude = new Set(['node_modules', '.git', '.next', 'dist', 'out', 'build']);

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function walk(dir) {
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const ent of entries) {
    if (exclude.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files.push(...await walk(full));
    } else if (ent.isFile()) {
      // skip binary-ish files by extension
      const ext = path.extname(ent.name).toLowerCase();
      const skipExt = ['.png','.jpg','.jpeg','.gif','.ico','.zip','.tar','.gz','.mp4','.mp3','.db','.sqlite','.lock','.wasm'];
      if (skipExt.includes(ext)) continue;
      files.push(full);
    }
  }
  return files;
}

(async () => {
  try {
    const files = await walk(root);
    files.sort();

    const header = `<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n<title>All code dump - anapath</title>\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<style>body{font-family:Inter,Segoe UI,Arial,Helvetica,sans-serif;margin:0;padding:0;background:#f6f8fb;color:#111}header{padding:16px;background:#0b5fa5;color:#fff}main{padding:18px}section.file{margin:12px 0;border-radius:6px;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden}section.file summary{padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer}section.file pre{margin:0;padding:12px 16px;overflow:auto;white-space:pre;background:#f8f9fb}path{font-family:monospace;color:#0b5fa5}small.meta{color:#666}details[open] summary{background:#f1f5f9} .toolbar{padding:12px;background:#ffffff;display:flex;gap:8px;flex-wrap:wrap}button.copy{padding:6px 10px;border-radius:6px;border:1px solid #ddd;background:#f7f7f7;cursor:pointer} .filename{font-family:monospace; font-weight:600}</style>\n</head>\n<body>\n<header><h1>anapath — All code dump</h1><div style="font-size:13px;">Generated: ${new Date().toISOString()}</div></header>\n<main>\n<div class="toolbar"><button onclick="expandAll()">Expand all</button><button onclick="collapseAll()">Collapse all</button><button onclick="downloadAll()">Download .zip (not implemented)</button></div>\n`;

    const footer = `</main>\n<script>function escape(s){return s;}function expandAll(){document.querySelectorAll('details').forEach(d=>d.open=true);}function collapseAll(){document.querySelectorAll('details').forEach(d=>d.open=false);}function copyCode(btn, id){const el=document.getElementById(id);navigator.clipboard.writeText(el.innerText).then(()=>{btn.textContent='Copied';setTimeout(()=>btn.textContent='Copy',1200)});}function downloadAll(){alert('Download zip is not implemented in this generator.');}</script>\n</body>\n</html>`;

    let out = header;
    let counter = 0;
    for (const f of files) {
      // don't include the generated output itself if re-run
      if (path.resolve(f) === path.resolve(outFile)) continue;
      const rel = path.relative(root, f).replace(/\\/g, '/');
      let content;
      try {
        content = await fs.promises.readFile(f, 'utf8');
      } catch (e) {
        // skip unreadable files
        continue;
      }
      counter++;
      const id = 'code-' + counter;
      out += `<section class="file"><details><summary><span class="filename">${rel}</span> <small class="meta"> — ${content.split('\n').length} lines</small><span><button class="copy" onclick="copyCode(this,'${id}')">Copy</button></span></summary><pre id="${id}"><code>${escapeHtml(content)}</code></pre></details></section>\n`;
    }

    out += `<div style="padding:12px;color:#555">Files included: ${counter}</div>`;
    out += footer;

    await fs.promises.writeFile(outFile, out, 'utf8');
    console.log('Wrote', outFile, 'with', counter, 'files');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
