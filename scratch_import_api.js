const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let count = 0;

files.forEach(file => {
  if (file.includes('src\\lib\\config.ts') || file.includes('src/lib/config.ts')) return;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Regex to match any local definition of API_BASE_URL
  const regex = /const\s+API_BASE_URL\s*=\s*process\.env\.NEXT_PUBLIC_API_BASE_URL[^;]*;/g;
  
  if (regex.test(content)) {
    // Replace it with the import statement
    content = content.replace(regex, 'import { API_BASE_URL } from "@/lib/config";');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
    count++;
  }
});

console.log('Done replacing in', count, 'files.');
