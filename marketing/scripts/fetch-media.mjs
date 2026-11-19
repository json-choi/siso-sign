// Downloads every photo shown on the live /work pages into marketing/media/.
// Files are named after their R2 key (e.g. 4fd92e71-....webp) so designs can
// refer to a photo even when the portfolio order changes. manifest.json lists
// each project's title and photos in display order.
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const site = process.env.SITE ?? 'https://www.siso-sign.com';
const width = process.env.WIDTH ?? '1920';
const out = new URL('../media/', import.meta.url).pathname;
await mkdir(out, { recursive: true });

const get = async (path) => {
  const response = await fetch(site + path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.text();
};
const unique = (items) => [...new Set(items)];
const decode = (text) => text.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

const work = await get('/work');
const ids = unique([...work.matchAll(/\/work\/([0-9a-f-]{36})/g)].map((m) => m[1]));
const manifest = [];
for (const id of ids) {
  const html = await get(`/work/${id}`);
  const title = decode(html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1]?.trim() ?? id);
  // The carousel's image list sits in the RSC payload; other projects' photos
  // (Related Work) are not part of it.
  const list = html.replace(/\\"/g, '"').match(/"images":\[([^\]]*)\]/)?.[1] ?? html.split('Related Work')[0];
  const sources = unique([...list.matchAll(/\/media\/portfolios\/[A-Za-z0-9._-]+/g)].map((m) => m[0]));
  const files = [];
  for (const source of sources) {
    const name = `${basename(source, extname(source))}.webp`;
    if (!existsSync(join(out, name))) {
      const response = await fetch(`${site}${source}?w=${width}`, { headers: { accept: 'image/webp,image/*' } });
      if (!response.ok) { console.warn(`skip ${source}: ${response.status}`); continue; }
      await writeFile(join(out, name), Buffer.from(await response.arrayBuffer()));
    }
    files.push(name);
  }
  manifest.push({ id, title, files });
  console.log(`${title}: ${files.length}`);
}
await writeFile(join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.length} projects → ${out}`);
