import fs from 'fs';
import path from 'path';

// Move all images from src/images to public/images
const srcDir = path.resolve(__dirname, '../src/images');
const publicDir = path.resolve(__dirname, '../public/images');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
for (const file of files) {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(publicDir, file);
  fs.copyFileSync(srcPath, destPath);
  console.log(`Moved: ${file}`);
}

console.log('All images moved to public/images.');
