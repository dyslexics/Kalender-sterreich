import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const expected = '<script type="module" src="/index.tsx"></script>'

if (!html.includes(expected)) {
  console.error('Missing Vite entry script in index.html:', expected);
  process.exit(1);
}

console.log('index.html contains the expected Vite entry script.');
