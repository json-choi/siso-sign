// Copies what reels-01 needs into reels-01/assets/ (git-ignored): the chosen
// portfolio photos from media/, the fonts and GSAP from node_modules. The
// preview server only serves the project folder, so files must live inside it.
import { copyFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const assets = `${root}reels-01/assets/`;
await mkdir(assets, { recursive: true });

// R2 keys of the photos used in reels-01/index.html.
export const photos = [
  '4fd92e71-e453-4781-8052-adc59b71e7d2', // 맑은수한약국
  'ac7a7238-6e90-49b4-85a7-ba1e7f52b52f', // 오브옉트 레코드바
  '1774791730517-8h5kd1z', // you need ramen
  '1768138605147-b3trydt', // scalartis
  '1774577309257-k3f46fh', // 애니포스만화학원 분당점
  '01f596f0-0b67-42b5-bf5d-7e88da1afc2d', // Next ID
  '1774573305635-rytblrl', // KINFOLK
  '1774577523405-v2x8u1g', // YU:Z MANS HAIR
  '81465a6c-9f00-497c-b2af-9fe3c5a4bce6', // TOMO
  '67f74bc4-e5a1-44f5-a61f-83ea5cd73574', // make by sona
];

const missing = photos.filter((key) => !existsSync(`${root}media/${key}.webp`));
if (missing.length) {
  console.error(`Missing photos in media/: ${missing.join(', ')}\nRun: npm run fetch-media`);
  process.exit(1);
}
for (const key of photos) await copyFile(`${root}media/${key}.webp`, `${assets}${key}.webp`);

const files = {
  'gsap.min.js': 'node_modules/gsap/dist/gsap.min.js',
  'Pretendard-Medium.woff2': 'node_modules/pretendard/dist/web/static/woff2/Pretendard-Medium.woff2',
  'Pretendard-Bold.woff2': 'node_modules/pretendard/dist/web/static/woff2/Pretendard-Bold.woff2',
  'Pretendard-ExtraBold.woff2': 'node_modules/pretendard/dist/web/static/woff2/Pretendard-ExtraBold.woff2',
  'Geist-Medium.woff2': 'node_modules/geist/dist/fonts/geist-sans/Geist-Medium.woff2',
  'Geist-SemiBold.woff2': 'node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.woff2',
  'CalSans-Regular.woff2': 'instagram-carousel-01/CalSans-Regular.woff2',
};
for (const [name, from] of Object.entries(files)) await copyFile(`${root}${from}`, `${assets}${name}`);
console.log(`reels-01/assets ready (${photos.length} photos)`);
