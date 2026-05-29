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
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // 1. Remove uppercase from tailwind classes
  content = content.replace(/\buppercase\b/g, '');
  // Clean up any double spaces left behind in classnames
  content = content.replace(/  +/g, ' ');
  // Clean up trailing/leading spaces inside class quotes
  content = content.replace(/\" /g, '\"').replace(/ \"/g, '\"');

  // 2. Replace user-facing 'Rationale' with 'Reason'
  content = content.replace(/Rationale/g, 'Reason');
  content = content.replace(/rationale/g, 'reason');
  
  // Fix back api paths and variable names if they got mangled
  content = content.replace(/\/api\/ai\/Reason/g, '/api/ai/rationale');
  content = content.replace(/\/api\/ai\/reason/g, '/api/ai/rationale');
  content = content.replace(/ReasonValidationFlow/g, 'rationaleValidationFlow');
  content = content.replace(/reasonValidationFlow/g, 'rationaleValidationFlow');
  content = content.replace(/setAppealReason/g, 'setAppealReason'); // This is fine
  content = content.replace(/appealReason/g, 'appealReason'); // This is fine

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log('Modified', file);
  }
});
console.log('Modified ' + modifiedCount + ' files.');
