const fs = require('fs');
const report = JSON.parse(fs.readFileSync('./lighthouse-mobile-cls.json', 'utf8'));

console.log('=== Mobile Lighthouse Results ===');
console.log('');
console.log('Performance: ' + Math.round(report.categories.performance.score * 100));
console.log('Accessibility: ' + Math.round(report.categories.accessibility.score * 100));
console.log('');

const audits = report.audits;

console.log('--- CLS ---');
if (audits['cumulative-layout-shift']) {
  console.log('CLS: ' + audits['cumulative-layout-shift'].numericValue.toFixed(3));
}

console.log('');
console.log('--- Layout Shift Elements ---');
if (audits['layout-shift-elements'] && audits['layout-shift-elements'].details && audits['layout-shift-elements'].details.items) {
  audits['layout-shift-elements'].details.items.forEach(item => {
    console.log('Element: ' + (item.node ? item.node.snippet.substring(0, 80) : 'N/A'));
    console.log('Score contribution: ' + (item.score || 0).toFixed(4));
  });
} else {
  console.log('No layout shift elements detected');
}

console.log('');
console.log('--- Accessibility Issues (score=0) ---');
for (const [key, audit] of Object.entries(audits)) {
  if (audit.score !== null && audit.score === 0 && audit.details && audit.details.items && audit.details.items.length > 0) {
    console.log('');
    console.log('[FAIL] ' + audit.title);
    audit.details.items.slice(0, 3).forEach(item => {
      if (item.node && item.node.snippet) {
        console.log('  - ' + item.node.snippet.substring(0, 80));
      }
    });
  }
}
