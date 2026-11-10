const fs = require('fs');
const path = require('path');

let agGrid = '';
let agAlpine = '';
try {
  agGrid = fs.readFileSync(path.join(__dirname, 'node_modules/ag-grid-community/styles/ag-grid.css'), 'utf8');
} catch (e) {
  try {
    agGrid = fs.readFileSync(path.join(__dirname, '../../node_modules/ag-grid-community/styles/ag-grid.css'), 'utf8');
  } catch (err) {}
}

try {
  agAlpine = fs.readFileSync(path.join(__dirname, 'node_modules/ag-grid-community/styles/ag-theme-alpine.css'), 'utf8');
} catch (e) {
  try {
    agAlpine = fs.readFileSync(path.join(__dirname, '../../node_modules/ag-grid-community/styles/ag-theme-alpine.css'), 'utf8');
  } catch (err) {}
}

const srcCss = fs.readFileSync(path.join(__dirname, 'src/styles.css'), 'utf8');
let combined = [agGrid, agAlpine, srcCss].filter(Boolean).join('\n\n');

// Compatibility patch for older PostCSS / Webpack 4 parsers (e.g. CRA 3.x):
// Wrap bare math expressions inside min() and max() with calc()
combined = combined.replace('min(100%, 100vw - 30px)', 'min(100%, calc(100vw - 30px))');
combined = combined.replace(
  'min(var(--ag-line-height, calc(var(--ag-row-height) - var(--ag-row-border-width))), var(--ag-row-height) - var(--ag-row-border-width) - 2px)',
  'min(var(--ag-line-height, calc(var(--ag-row-height) - var(--ag-row-border-width))), calc(var(--ag-row-height) - var(--ag-row-border-width) - 2px))'
);
combined = combined.replace('max(0px, 24px - var(--ag-grid-size) * 1.5)', 'max(0px, calc(24px - var(--ag-grid-size) * 1.5))');

fs.writeFileSync(path.join(__dirname, 'dist/styles.css'), combined, 'utf8');
fs.writeFileSync(path.join(__dirname, 'styles.css'), combined, 'utf8');

// Also emit dist/index.cjs.js for bundlers that do not support .cjs extension
if (fs.existsSync(path.join(__dirname, 'dist/index.cjs'))) {
  fs.copyFileSync(path.join(__dirname, 'dist/index.cjs'), path.join(__dirname, 'dist/index.cjs.js'));
}
console.log('Successfully bundled ReturnGuard + AG Grid styles and index.cjs.js with PostCSS compatibility');
