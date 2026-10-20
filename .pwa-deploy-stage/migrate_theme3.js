import fs from 'fs';
import path from 'path';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('./src');

let changedFiles = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  let changed = false;
  
  for (let i = 0; i < lines.length; i++) {
    // If line has bg-theme-inverse and text-white, replace text-white with text-theme-text-inverse
    if (lines[i].includes('bg-theme-inverse') && lines[i].includes('text-white')) {
      lines[i] = lines[i].replace(/\btext-white\b/g, 'text-theme-text-inverse');
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, lines.join('\n'), 'utf8');
    changedFiles++;
  }
});

console.log(`Updated ${changedFiles} files with text-theme-text-inverse (pass 3).`);
