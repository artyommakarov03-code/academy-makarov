import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const appRoot = fileURLToPath(new URL('.', import.meta.url));
const bundlesRoot = join(appRoot, '..', 'pixel-dnd-assets');

function listBundleDirectories(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(root, entry.name))
    .filter(dir => readdirSync(dir).some(name => /^chunk-\d+\.b64$/.test(name)));
}

function isSafeDestination(pathname) {
  const normalized = normalize(pathname).replaceAll('\\', '/');
  return normalized.startsWith('pixel-dnd/assets/')
    || normalized.startsWith('pixel-dnd/data/universes/');
}

function restoreTarGzBundle(bundleDir) {
  const encoded = readdirSync(bundleDir)
    .filter(name => /^chunk-\d+\.b64$/.test(name))
    .sort()
    .map(name => readFileSync(join(bundleDir, name), 'utf8').trim())
    .join('');

  if (!encoded) return 0;
  const tar = gunzipSync(Buffer.from(encoded, 'base64'));
  let offset = 0;
  let restored = 0;

  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;

    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '');
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
    const size = Number.parseInt(sizeText || '0', 8);
    const dataStart = offset + 512;

    if (name && size >= 0 && isSafeDestination(name)) {
      const relativePath = name.slice('pixel-dnd/'.length);
      const destination = join(appRoot, relativePath);
      const guard = relative(appRoot, destination);
      if (!guard.startsWith('..')) {
        mkdirSync(dirname(destination), { recursive: true });
        writeFileSync(destination, tar.subarray(dataStart, dataStart + size));
        restored += 1;
      }
    }

    offset = dataStart + Math.ceil(size / 512) * 512;
  }

  return restored;
}

let total = 0;
for (const bundleDir of listBundleDirectories(bundlesRoot)) {
  const count = restoreTarGzBundle(bundleDir);
  total += count;
  console.log(`Восстановлен пакет ${bundleDir}: ${count} файлов`);
}
console.log(`Всего восстановлено игровых ассетов и манифестов: ${total}`);
