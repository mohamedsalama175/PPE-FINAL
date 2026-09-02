const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
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
  { id: 'margin', name: 'Margin (ml/mr)', regex: /\b(-?ml-|-?mr-)\d+(\.\d+)?\b/g },
  { id: 'padding', name: 'Padding (pl/pr)', regex: /\b(pl-|pr-)\d+(\.\d+)?\b/g },
  { id: 'border', name: 'Border (border-l/border-r)', regex: /\b(border-[lr](-\S+)?)\b/g },
  { id: 'textAlign', name: 'Text align (text-left/text-right)', regex: /\b(text-left|text-right)\b/g },
  { id: 'position', name: 'Position (left-/right-)', regex: /\b(-?left-|-?right-)\d+(\.\d+)?\b/g },
  { id: 'rounded', name: 'Rounded (rounded-l/r/tl/tr/bl/br)', regex: /\brounded-([lr]|t[lr]|b[lr])(-\S+)?\b/g },
  { id: 'floatClear', name: 'Float/Clear', regex: /\b(float-left|float-right|clear-left|clear-right)\b/g },
  { id: 'ltrRtl', name: 'ltr: or rtl: prefixes', regex: /\b(ltr:|rtl:)\S+/g },
  { id: 'icons', name: 'Icons (Arrow/Chevron)', regex: /\b(ChevronLeft|ChevronRight|ArrowLeft|ArrowRight|CornerDownLeft|CornerDownRight)\b/g },
];

const results = {};
for (const rule of rules) {
  results[rule.id] = { name: rule.name, matches: [] };
}

for (const filePath of allFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    for (const rule of rules) {
      rule.regex.lastIndex = 0;
      let match;
      while ((match = rule.regex.exec(line)) !== null) {
        results[rule.id].matches.push({
          file: filePath.replace(/\\/g, '/'),
          line: index + 1,
          matched: match[0],
          text: line.trim()
        });
      }
    }
  });
}

fs.writeFileSync('.agents/teamwork/explorer_m4_it2_3/scan_results.json', JSON.stringify(results, null, 2));
console.log('Saved scan results to .agents/teamwork/explorer_m4_it2_3/scan_results.json');
