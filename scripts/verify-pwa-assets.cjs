const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const fail = (message) => {
  console.error(`PWA verification failed: ${message}`);
  process.exitCode = 1;
};

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const manifestLink = html.match(/<link\s+rel="manifest"\s+href="([^"]+)"/i)?.[1];
if (manifestLink !== '/manifest.json') fail(`Expected /manifest.json in index.html, got ${manifestLink || 'no manifest link'}`);

const manifest = readJson('public/manifest.json');
if (manifest.name !== 'Lalao' || manifest.short_name !== 'Lalao') fail('Manifest app names must be Lalao.');
if (manifest.start_url !== '/app' || manifest.scope !== '/' || manifest.display !== 'standalone') fail('Unexpected app launch settings.');

for (const icon of manifest.icons || []) {
  const file = path.join(root, 'public', icon.src.replace(/^\//, ''));
  if (!fs.existsSync(file)) {
    fail(`Missing manifest icon ${icon.src}`);
    continue;
  }
  if (icon.type === 'image/png') {
    const png = fs.readFileSync(file);
    if (png.length < 24 || !png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
      fail(`${icon.src} is not a valid PNG.`);
      continue;
    }
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    if (icon.sizes && icon.sizes !== `${width}x${height}`) fail(`${icon.src} declares ${icon.sizes}, actual dimensions are ${width}x${height}.`);
    console.log(`${icon.src}: ${width}x${height} PNG`);
  }
}

for (const file of ['public/favicon.ico', 'public/favicon-32x32.png', 'public/favicon-16x16.png', 'public/apple-touch-icon.png']) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing ${file}`);
}

if (!process.exitCode) console.log('PWA manifest and icon assets verified.');
