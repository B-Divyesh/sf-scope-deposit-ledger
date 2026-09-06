import { cp, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const version = process.env.RELEASE_VERSION || packageJson.version;
if (!/^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/.test(version)) throw new Error('RELEASE_VERSION must be a safe release identifier.');
const dist = join(root, 'dist');

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat();
}

const swTemplate = await readFile(join(root, 'public/sw.js'), 'utf8');
const allFiles = await files(dist);
const precache = allFiles
  .map((file) => `/${relative(dist, file).split(sep).join('/')}`)
  // Azure consumes this deployment configuration; it is deliberately not a
  // public URL and must never make service-worker installation fail.
  .filter((file) => !file.startsWith('/.vite/') && !file.endsWith('.map') && file !== '/sw.js' && file !== '/manifest.webmanifest' && file !== '/staticwebapp.config.json' && file !== '/_headers')
  .sort();
const sw = swTemplate
  .replaceAll('__RELEASE_VERSION__', version)
  // Precache both demo route spellings. A newly installed worker did not
  // control the first /demo request, so an immediate offline reload otherwise
  // fell back to / and left the isolated sample mode.
  .replace('__PRECACHE_URLS__', JSON.stringify(['/', '/demo', '/demo/', '/manifest.webmanifest', ...precache]));
const manifest = (await readFile(join(root, 'public/manifest.webmanifest'), 'utf8')).replaceAll('__RELEASE_VERSION__', version);
await writeFile(join(dist, 'sw.js'), sw);
await writeFile(join(dist, 'manifest.webmanifest'), manifest);

// The static host consumes this standard headers file from the build output.
await cp(join(root, 'public/_headers'), join(dist, '_headers'));
