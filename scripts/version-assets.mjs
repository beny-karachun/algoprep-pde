import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const versions = new Map();
for (const file of fs.readdirSync('site/assets')) {
  if (!/\.(?:css|js)$/.test(file)) continue;
  versions.set(file, createHash('sha256').update(fs.readFileSync(path.join('site/assets', file))).digest('hex').slice(0, 10));
}
function update(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) update(file);
    else if (entry.name.endsWith('.html')) {
      const source = fs.readFileSync(file, 'utf8');
      const updated = source.replace(/\/assets\/([^"?]+\.(?:css|js))(?:\?v=[a-f0-9]+)?(?=")/g, (match, asset) =>
        versions.has(asset) ? `/assets/${asset}?v=${versions.get(asset)}` : match);
      if (updated !== source) fs.writeFileSync(file, updated);
    }
  }
}
update('site');
console.log('Asset versions updated.');
