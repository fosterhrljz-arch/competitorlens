import { copyFile, readFile, writeFile } from 'node:fs/promises';
const file = await readFile('dist/index.html', 'utf8');
// A classic inline bundle opens over file:// without a module fetch or web server.
let script = '';
const shell = file.replace(/<script type="module" crossorigin>([\s\S]*?)<\/script>/g, (_, code) => { script += code; return ''; });
if (!script) throw new Error('Expected an inline Vite bundle.');
// Classic inline scripts execute immediately: place the bundle after #root exists.
const portable = shell.replace('</body>', () => `<script>${script}</script></body>`);
await writeFile('dist/index.html', portable);
await copyFile('dist/index.html', 'CompetitorLens.html');
console.log('Portable application ready: double-click CompetitorLens.html');
