/* Optional packaging step, not a server. Run node tools/build.mjs after editing a case. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'cases'), packages = [];
function filesAt(p, base = '') { return fs.readdirSync(p, { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesAt(path.join(p, e.name), base + e.name + '/') : [{ name: base + e.name, path: path.join(p, e.name) }]); }
const textExtensions = new Set(['html', 'htm', 'css', 'js', 'mjs', 'json', 'svg', 'txt', 'csv', 'tsv', 'md', 'xml', 'geojson']);
const mimeTypes = { html: 'text/html', htm: 'text/html', css: 'text/css', js: 'text/javascript', mjs: 'text/javascript', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif', woff: 'font/woff', woff2: 'font/woff2', pdf: 'application/pdf' };
function packFile(file) {
  const bytes = fs.readFileSync(file.path), ext = path.extname(file.name).slice(1).toLowerCase(), mime = mimeTypes[ext] || 'application/octet-stream';
  return { name: file.name, size: bytes.length, enc: textExtensions.has(ext) ? 'text' : 'dataurl', mime, data: textExtensions.has(ext) ? bytes.toString('utf8') : `data:${mime};base64,${bytes.toString('base64')}` };
}
for (const folder of fs.readdirSync(dir).sort()) {
  const p = path.join(dir, folder); if (!fs.statSync(p).isDirectory() || !fs.existsSync(path.join(p, 'case.json'))) continue;
  for (const name of ['engine.js', 'demo.css']) fs.copyFileSync(path.join(root, 'tools', name), path.join(p, 'demo', name));
  const manifest = JSON.parse(fs.readFileSync(path.join(p, 'case.json'), 'utf8'));
  const files = filesAt(p).filter(f => f.name !== 'case.json' && f.name !== 'README.txt').map(packFile);
  packages.push({ manifest, files, folder });
}
packages.sort((a, b) => a.manifest.sceneId.localeCompare(b.manifest.sceneId));
const body = `/* Generated from cases/. Rebuild: node tools/build.mjs */\nwindow.RefineryPackages = ${JSON.stringify(packages)};\n(function(){\n  window.RefineryPackages.forEach(function(p){\n    var def=JSON.parse(JSON.stringify(p.manifest)), handle=null;\n    def.packFolder=p.folder;\n    def.tabs.demo.mount=function(root,ctx){handle=window.CaseDemoHost.create(root,{files:p.files,demo:p.manifest.tabs.demo,meta:p.manifest},ctx);};\n    def.tabs.demo.unmount=function(){if(handle){handle.destroy();handle=null;}};\n    window.Cases.register(def);\n    var sc=window.ATLAS.index.byScene[def.sceneId]; if(sc){sc.demo=true;sc.status='full';}\n  });\n})();\n`;
fs.writeFileSync(path.join(root, 'assets/cases.bundle.js'), body);
// Version by content so a rebuilt case is not hidden by a cached bundle.
const indexFile = path.join(root, 'index.html'), index = fs.readFileSync(indexFile, 'utf8'), version = createHash('sha256').update(body).digest('hex').slice(0, 12);
fs.writeFileSync(indexFile, index.replace(/assets\/cases\.bundle\.js(?:\?v=[^"\s]*)?/, 'assets/cases.bundle.js?v=' + version));
console.log(`已打包 ${packages.length} 个内置案例；站点与各案例均可通过 file:// 运行。`);
