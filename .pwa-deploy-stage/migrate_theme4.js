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
  { regex: /\bbg-\[\#f6f3ee\]/g, replacement: 'bg-theme-base' },
  { regex: /\bbg-\[\#F8F9FA\]/g, replacement: 'bg-theme-base' },
  { regex: /\bbg-\[\#f8f6f3\]/g, replacement: 'bg-theme-base' },
  { regex: /\bbg-\[\#f7f4f0\]/g, replacement: 'bg-theme-base' },
  { regex: /\bbg-\[\#f9f7f4\]/g, replacement: 'bg-theme-base' },
  { regex: /\bbg-\[\#F8F7FF\]/g, replacement: 'bg-theme-base' },
  // Let's also catch text neutral 950 just in case there was a typo in pass 2, but it reported 0
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

console.log(`Updated ${changedFiles} files with bg-theme-base (pass 4).`);
