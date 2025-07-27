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

// 3. Copy manifest
const manifestSrc = target === 'firefox'
  ? path.resolve(__dirname, 'src', 'manifest.json.ff')
  : path.resolve(__dirname, 'src', 'manifest.json');
fs.copyFileSync(manifestSrc, path.join(distDir, 'manifest.json'));

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
