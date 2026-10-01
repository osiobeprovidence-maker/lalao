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

const replacements = [
  // Backgrounds
  { regex: /\bbg-black\b(?!\/)/g, replacement: 'bg-theme-inverse' },
  { regex: /\bbg-neutral-950\b/g, replacement: 'bg-theme-inverse' },
  { regex: /\bbg-neutral-700\b/g, replacement: 'bg-theme-inverse' },
  { regex: /\bbg-neutral-300\b/g, replacement: 'bg-theme-divider-strong' },

  // Texts
  { regex: /\btext-neutral-950\b/g, replacement: 'text-theme-primary' },
  { regex: /\btext-neutral-300\b/g, replacement: 'text-theme-tertiary' },
  { regex: /\btext-neutral-200\b/g, replacement: 'text-theme-tertiary' },
  { regex: /\btext-black\b/g, replacement: 'text-theme-primary' },

  // Borders
  { regex: /\bborder-neutral-900\b/g, replacement: 'border-theme-divider-inverse' },
  { regex: /\bborder-neutral-700\b/g, replacement: 'border-theme-divider-strong' },
  { regex: /\bborder-neutral-500\b/g, replacement: 'border-theme-divider-strong' },
  { regex: /\bborder-neutral-50\b/g, replacement: 'border-theme-divider-light' },

  // Fills
  { regex: /\bfill-neutral-950\b/g, replacement: 'fill-theme-primary' },
];

let changedFiles = 0;

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  let newContent = content;
  
  replacements.forEach(({ regex, replacement }) => {
    newContent = newContent.replace(regex, replacement);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
  }
});

console.log(`Updated ${changedFiles} files with semantic theme tokens (pass 2).`);
