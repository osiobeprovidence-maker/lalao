const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      // Find useMemo blocks
      const regex = /useMemo\([^)]*\)[^{]*\{([\s\S]*?)\}/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[1].includes('.filter(')) {
          console.log('Match found in:', fullPath);
          console.log(match[0].split('\n').slice(0, 5).join('\n'));
          console.log('---');
        }
      }
    }
  }
}

searchDir(path.join(__dirname, 'src'));
