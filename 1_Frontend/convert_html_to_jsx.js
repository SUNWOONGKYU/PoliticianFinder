const fs = require('fs');
const path = require('path');

// Read the prototype HTML file
const htmlPath = './../../0-2_UIUX_Design/prototypes/html/pages/index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

// Extract body content
const bodyStart = html.indexOf('<body');
const bodyEnd = html.lastIndexOf('</body>');
let bodyContent = html.substring(bodyStart + html.substring(bodyStart).indexOf('>') + 1, bodyEnd);

// Simple HTML to JSX conversion
let jsx = bodyContent
  .replace(/class="/g, 'className="')
  .replace(/for="/g, 'htmlFor="')
  .replace(/<\/br>/g, '')
  .replace(/<br>/g, '');

// Create the full page.tsx content
const output = `'use client';

export default function Home() {
  return (
    <>
      ${jsx}
    </>
  );
}
`;

// Write to file
fs.writeFileSync(path.join(__dirname, 'src/app/page_converted.tsx'), output);
console.log('✅ Conversion complete!');
