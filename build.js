// build.js: Cross-platform build/export script for OSDS extension (React modernized)
// Usage: node build.js [chrome|firefox]

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const target = process.argv[2] || 'chrome';
if (!['chrome', 'firefox'].includes(target)) {
  console.error('Usage: node build.js [chrome|firefox]');
  process.exit(1);
}

const distDir = path.resolve(__dirname, 'dist', target);
if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

// 1. Build React app (Vite)
console.log('Building React app...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Copy built React files
const reactDist = path.resolve(__dirname, 'dist', 'react');
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const file of fs.readdirSync(src)) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
copyRecursive(reactDist, distDir);

// 3. Generate manifest from template
const manifestTemplatePath = path.resolve(__dirname, 'src', 'manifest.template.json');
let manifestTemplate = fs.readFileSync(manifestTemplatePath, 'utf8');

function getManifestReplacements(target) {
  if (target === 'chrome') {
    return {
      manifest_version: 3,
      minimum_chrome_version: '88',
      applications: 'null',
      action: JSON.stringify({
        default_icon: 'images/icon16.png',
        default_title: 'Show Document Metadata',
        default_popup: 'popup.html'
      }),
      browser_action: 'null',
      permissions: JSON.stringify([
        'storage',
        'declarativeNetRequest',
        'contextMenus'
      ]),
      host_permissions: JSON.stringify([
        '*://*/*',
        'file:///*'
      ]),
      options_page: 'index.html',
      options_ui: 'null',
      content_scripts: 'null',
      content_security_policy: JSON.stringify({
        extension_pages: "script-src 'self'; object-src 'self'; style-src 'self' 'unsafe-inline' https://solid.openlinksw.com; media-src 'self';"
      }),
      side_panel: JSON.stringify({ default_path: 'sidebar.html' })
    };
  } else {
    return {
      manifest_version: 2,
      minimum_chrome_version: '18',
      applications: JSON.stringify({ gecko: { id: 'osds@openlinksw.com' } }),
      action: 'null',
      browser_action: JSON.stringify({
        default_icon: 'images/icon16.png',
        default_title: 'Show Document Metadata',
        default_popup: 'panel.html'
      }),
      permissions: JSON.stringify([
        'storage',
        'webRequest',
        'webRequestBlocking',
        '*://*/*',
        'file:///*/*',
        'contextMenus'
      ]),
      host_permissions: 'null',
      options_page: '',
      options_ui: JSON.stringify({ page: 'options.html', open_in_tab: true }),
      content_scripts: JSON.stringify([
        {
          matches: ['file:///*/*', '*://*/*'],
          js: [
            'lib/RDFa.js',
            'lib/n3-browser.js',
            'lib/namespace.js',
            'lib/posh.js',
            'utils.js',
            'helpers_ui.js',
            'browser.js',
            'settings.js',
            'sniffer.js'
          ],
          css: ['content.css'],
          run_at: 'document_idle'
        },
        {
          matches: ['https://*/*'],
          js: ['browser.js', 'oidc-webid-inject.js'],
          run_at: 'document_start'
        },
        {
          matches: ['<all_urls>'],
          js: ['frame.js'],
          run_at: 'document_idle',
          all_frames: true
        }
      ]),
      content_security_policy: JSON.stringify(
        "script-src 'self' 'unsafe-eval' moz-extension://lib; object-src 'self' moz-extension://lib; style-src 'self' 'unsafe-inline' moz-extension://lib https://solid.openlinksw.com; media-src 'self' 'unsafe-inline' moz-extension://lib ;"
      ),
      side_panel: 'null'
    };
  }
}

const replacements = getManifestReplacements(target);
for (const [key, value] of Object.entries(replacements)) {
  const re = new RegExp(`"{{${key}}}"|{{${key}}}`, 'g');
  manifestTemplate = manifestTemplate.replace(re, value);
}
fs.writeFileSync(path.join(distDir, 'manifest.json'), manifestTemplate);

// 4. Copy static assets (images, lib, etc.)
const staticDirs = ['images', 'lib'];
for (const dir of staticDirs) {
  const src = path.resolve(__dirname, 'src', dir);
  if (fs.existsSync(src)) copyRecursive(src, path.join(distDir, dir));
}

// 5. Copy any extra files (AUTHORS, COPYING, etc.)
const extraFiles = ['AUTHORS', 'COPYING', 'CREDITS'];
for (const file of extraFiles) {
  const src = path.resolve(__dirname, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, file));
}

console.log(`\nBuild complete: ${distDir}\n`);
console.log('You can now load this folder as an unpacked extension in your browser.');
