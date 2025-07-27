// Usage: node scripts/build-manifest.js [chrome|firefox]
// Outputs manifest.json in dist/ for the selected browser

const fs = require('fs');
const path = require('path');

const base = path.resolve(__dirname, '../src/manifest.json');
const target = process.argv[2] || 'chrome';
const outDir = path.resolve(__dirname, `../dist/${target}`);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const out = path.join(outDir, 'manifest.json');

const manifest = JSON.parse(fs.readFileSync(base, 'utf8'));

if (target === 'firefox') {
  // Firefox: use background.scripts, remove service_worker
  if (manifest.background && manifest.background.service_worker) {
    delete manifest.background.service_worker;
    manifest.background.scripts = ["background.js"];
  }
  // Remove side_panel (not supported in Firefox)
  if (manifest.side_panel) delete manifest.side_panel;
} else {
  // Chrome: use background.service_worker, remove scripts
  if (manifest.background && manifest.background.scripts) {
    delete manifest.background.scripts;
    manifest.background.service_worker = "background.js";
  }
  // Remove sidebar_action (not supported in Chrome)
  if (manifest.sidebar_action) delete manifest.sidebar_action;
}

fs.writeFileSync(out, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${out} for ${target}`);
