const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walk(fullPath, fileList);
    } else if (/\.(tsx|ts|jsx|js)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const pagesFiles = walk('src/pages');
const compFiles = walk('src/components');
const allFiles = [...pagesFiles, ...compFiles];

const rules = [
  { name: 'Margin (ml/mr)', regex: /\b(-?ml-|-?mr-)\d+(\.\d+)?\b/g },
  { name: 'Padding (pl/pr)', regex: /\b(pl-|pr-)\d+(\.\d+)?\b/g },
  { name: 'Border (border-l/border-r)', regex: /\b(border-[lr](-\S+)?)\b/g },
  { name: 'Text align (text-left/text-right)', regex: /\b(text-left|text-right)\b/g },
  { name: 'Position (left-/right-)', regex: /\b(-?left-|-?right-)\d+(\.\d+)?\b/g },
  { name: 'Rounded (rounded-l/r/tl/tr/bl/br)', regex: /\brounded-([lr]|t[lr]|b[lr])(-\S+)?\b/g },
  { name: 'Float/Clear', regex: /\b(float-left|float-right|clear-left|clear-right)\b/g },
  { name: 'ltr: or rtl: prefixes', regex: /\b(ltr:|rtl:)\S+/g },
  { name: 'Icons (Arrow/Chevron)', regex: /\b(ChevronLeft|ChevronRight|ArrowLeft|ArrowRight|CornerDownLeft|CornerDownRight)\b/g },
];

console.log(`Scanning ${allFiles.length} files in src/pages and src/components...`);

const results = {};

for (const rule of rules) {
  results[rule.name] = [];
}

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const rule of rules) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        results[rule.name].push({
          file: filePath.replace(/\\/g, '/'),
          line: index + 1,
          matched: match[0],
          text: line.trim()
        });
      }
    }
  });
}

for (const [ruleName, matches] of Object.entries(results)) {
  console.log(`\n==================================================`);
  console.log(`RULE: ${ruleName} (Total Matches: ${matches.length})`);
  console.log(`==================================================`);
  for (const m of matches) {
    console.log(`${m.file}:${m.line} [${m.matched}] -> ${m.text}`);
  }
}
