import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import type { D1Database } from '@cloudflare/workers-types';
import { databaseClient, ensureSchema } from '../src/lib/database-core';
import { MAX_ZOOM, parseImageSettings } from '../src/lib/image-display';
import { parsePortfolioInput } from '../src/lib/portfolio-input';
import { deviceOf, isBot, isBotRequest, kstDay, recordVisit, sourceOf, summarize } from '../src/lib/analytics';

const directory = await mkdtemp(join(tmpdir(), 'siso-d1-test-'));
const configPath = join(directory, 'wrangler.json');
await writeFile(configPath, JSON.stringify({ name: 'siso-d1-test', compatibility_date: '2026-09-08', d1_databases: [{ binding: 'DB', database_name: 'test', database_id: 'local-test' }] }));
const platform = await getPlatformProxy<{ DB: D1Database }>({ configPath, persist: { path: join(directory, 'state') } });
try {
  const sql = await readFile(new URL('../d1-migrations/0001_application.sql', import.meta.url), 'utf8');
  // The API's exec accepts a complete SQLite script, including trigger bodies.
  for (const statement of sql.split(/;\n\n/)) {
    if (statement.trim()) await platform.env.DB.prepare(statement).run();
  }
  const admin = databaseClient(platform.env.DB, true);
  const publicDb = databaseClient(platform.env.DB);
  const inserted = await admin.from('portfolios').insert({ title: '복원 테스트', images: ['one.webp','two.webp'], tags: ['한글'], is_published: false }).single();
  assert.equal(inserted.error, null); assert.ok(inserted.data);
  assert.equal(inserted.data.is_published, false); assert.deepEqual(inserted.data.images, ['one.webp','two.webp']);
  assert.equal((await publicDb.from('portfolios').select()).data?.length, 0);
  await admin.from('portfolios').update({ is_published: true }).eq('id', inserted.data.id);
  assert.equal((await publicDb.from('portfolios').select()).data?.length, 1);
  assert.throws(() => publicDb.from('admin_password'));
  assert.throws(() => publicDb.from('portfolios').delete());
  assert.throws(() => admin.from('portfolios').eq('id; DROP TABLE portfolios', 'x'));
  assert.ok((await admin.from('portfolios').delete()).error);
  const setting = await admin.from('site_settings').insert({ key: 'sample', value: 'old' }).single();
  assert.ok(setting.data);
  const failed = await admin.from('site_settings').upsert([{ key: 'sample', value: 'changed' }, { key: null, value: 'invalid' }], { onConflict: 'key' });
  assert.ok(failed.error);
  const unchanged = await admin.from('site_settings').eq('key', 'sample').single();
  assert.equal(unchanged.data?.value, 'old');
  await admin.from('site_settings').upsert([{ key: 'sample', value: 'new' }], { onConflict: 'key' });
  const updated = await admin.from('site_settings').eq('key', 'sample').single();
  assert.equal(updated.data?.id, setting.data.id); assert.equal(updated.data?.value, 'new');
  // project_type is added on first admin use because CI does not apply D1 migrations.
  const columns = await platform.env.DB.prepare('PRAGMA table_info("portfolios")').all<{ name: string }>();
  assert.ok(columns.results.some(column => column.name === 'project_type'));
  await ensureSchema(platform.env.DB);
  assert.equal((await admin.from('portfolios').update({ project_type: 'wholesale' }).eq('id', inserted.data.id)).error?.message, '데이터베이스 요청에 실패했습니다.');
  const retail = await admin.from('portfolios').insert({ title: '리테일', project_type: 'retail', sort_order: 0 }).single();
  assert.equal(retail.data?.project_type, 'retail');
  assert.equal((await admin.placePortfolios([
    { id: inserted.data.id, project_type: 'retail', sort_order: 0 },
    { id: retail.data!.id, project_type: 'commercial', sort_order: 0 },
  ])).error, null);
  const placed = await admin.from('portfolios').select().order('title', { ascending: true });
  assert.deepEqual(placed.data?.map(row => [row.title, row.project_type, row.sort_order]), [['리테일', 'commercial', 0], ['복원 테스트', 'retail', 0]]);
  assert.ok((await admin.placePortfolios([{ id: inserted.data.id, project_type: 'other', sort_order: 1 }])).error);
  assert.ok((await admin.placePortfolios([{ id: inserted.data.id, project_type: null, sort_order: 1.5 }])).error);
  assert.ok((await admin.placePortfolios([
    { id: inserted.data.id, project_type: null, sort_order: 5 },
    { id: 'missing', project_type: null, sort_order: 6 },
  ])).error);
  assert.equal((await admin.from('portfolios').eq('id', inserted.data.id).single()).data?.sort_order, 0);
  assert.throws(() => publicDb.placePortfolios([]));
  // Photo framing: crop per image as a JSON object and a detail-page ratio.
  const framed = await admin.from('portfolios').update({ image_settings: { 'one.webp': { x: 30, y: 70, zoom: 1.4 } }, display_ratio: '3:4' }).eq('id', inserted.data.id).single();
  assert.deepEqual(framed.data?.image_settings, { 'one.webp': { x: 30, y: 70, zoom: 1.4 } });
  assert.equal(framed.data?.display_ratio, '3:4');
  assert.ok((await admin.from('portfolios').update({ display_ratio: '2:1' }).eq('id', inserted.data.id)).error);
  assert.deepEqual(parseImageSettings({ 'a.webp': { x: 140, y: -5, zoom: 9 }, '': { x: 1 }, 'b.webp': 'bad' }), { 'a.webp': { x: 100, y: 0, zoom: MAX_ZOOM } });
  const parsedInput = parsePortfolioInput({ images: ['one.webp'], image_settings: { 'one.webp': { x: 10, y: 20, zoom: 1 }, 'gone.webp': { x: 1, y: 1, zoom: 1 } }, display_ratio: 'original' }, { requireTitle: false });
  assert.ok('data' in parsedInput);
  assert.deepEqual(Object.keys(parsedInput.data.image_settings as object), ['one.webp']);
  assert.ok('error' in parsePortfolioInput({ display_ratio: 'wide' }, { requireTitle: false }));
  const first = await admin.from('services').insert({ title: 'A', sort_order: 0 }).single();
  const second = await admin.from('services').insert({ title: 'B', sort_order: 1 }).single();
  assert.equal((await admin.reorder('services', [second.data!.id, first.data!.id])).error, null);
  assert.deepEqual((await admin.from('services').select().order('sort_order', { ascending: true })).data?.map(row => row.title), ['B', 'A']);
  assert.ok((await admin.reorder('services', [first.data!.id, first.data!.id])).error);
  assert.ok((await admin.reorder('services', [first.data!.id, 'missing'])).error);
  assert.equal((await admin.from('services').eq('id', first.data!.id).single()).data?.sort_order, 1);
  assert.throws(() => publicDb.reorder('services', []));
  await admin.from('services').delete().in('id', [first.data!.id, second.data!.id]);
  await admin.from('portfolios').delete().eq('id', retail.data!.id);
  await admin.from('portfolios').delete().eq('id', inserted.data.id);
  assert.equal((await admin.from('portfolios').select('*', { count: 'exact' })).count, 0);
  // Visit analytics: daily unique visitors, sources, devices, contact clicks.
  const now = Date.UTC(2026, 10, 19, 3, 0, 0);
  const iphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148';
  const mac = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15';
  const visit = (path: string, ip: string, ua: string, referrer: string | null, at = now, query = '') => recordVisit(platform.env.DB, {
    kind: 'view', path, url: new URL(`https://www.siso-sign.com${path}${query}`), referrer, userAgent: ua, ip, country: 'KR', salt: 'test', now: at,
  });
  await visit('/', '1.1.1.1', iphone, 'https://l.instagram.com/');
  await visit('/work', '1.1.1.1', iphone, 'https://www.siso-sign.com/');
  await visit('/', '2.2.2.2', mac, null, now, '?utm_source=ig&utm_campaign=launch');
  await visit('/', '1.1.1.1', iphone, null, now - 86_400_000);
  await visit('/', '9.9.9.9', mac, null, now - 8 * 86_400_000);
  await recordVisit(platform.env.DB, { kind: 'contact', path: 'instagram', url: new URL('https://www.siso-sign.com/contact'), referrer: null, userAgent: iphone, ip: '1.1.1.1', country: null, salt: 'test', now });
  const week = await summarize(platform.env.DB, 7, now);
  assert.equal(week.to, kstDay(now));
  assert.equal(week.daily.length, 7);
  assert.equal(week.views, 4);
  assert.equal(week.visitors, 3); // two people today, one of them again yesterday
  assert.equal(week.contacts, 1);
  assert.deepEqual(week.previous, { visitors: 1, views: 1, contacts: 0 });
  assert.deepEqual(week.daily.at(-1), { day: kstDay(now), visitors: 2, views: 3 });
  assert.deepEqual(Object.fromEntries(week.sources.map((r) => [r.key, r.count])), { instagram: 1, ig: 1, direct: 1 });
  assert.deepEqual(Object.fromEntries(week.devices.map((r) => [r.key, r.count])), { mobile: 2, desktop: 1 });
  assert.deepEqual(week.pages[0], { key: '/', count: 3 });
  assert.deepEqual(week.contactChannels, [{ key: 'instagram', count: 1 }]);
  assert.equal(kstDay(Date.UTC(2026, 10, 18, 15, 30)), '2026-11-19'); // 00:30 KST belongs to the next day
  assert.equal(sourceOf(new URL('https://www.siso-sign.com/'), 'https://m.search.naver.com/x'), 'naver');
  assert.ok(isBot('facebookexternalhit/1.1') && isBot('') && !isBot(iphone));
  for (const crawler of [
    'Mozilla/5.0 (compatible; Yeti/1.1; +https://naver.me/spd)',
    'Mozilla/5.0 (compatible; Daum/4.1; +http://cs.daum.net/faq/15/4118.html?faqId=28966)',
    'Mozilla/5.0 (compatible; MSIE or Firefox mutant; not on Windows server;) Daumoa 4.0',
    'Mozilla/5.0 (compatible; kakaotalk-scrap/1.0; +https://devtalk.kakao.com/t/scrap/33984)',
    'WhatsApp/2.23.20.0', 'Go-http-client/1.1', 'node-fetch/1.0', 'axios/1.6.0', 'okhttp/4.9.0',
  ]) assert.ok(isBot(crawler), crawler);
  const chrome = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
  for (const person of [chrome, 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 KAKAOTALK 10.4.5', 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 DaumApps/6.9.0'])
    assert.ok(!isBot(person), person);
  const browserRequest = (headers: Record<string, string>) => new Request('https://www.siso-sign.com/', { headers: { 'user-agent': chrome, ...headers } });
  assert.ok(!isBotRequest(browserRequest({ 'accept-language': 'ko-KR,ko;q=0.9' })));
  assert.ok(isBotRequest(browserRequest({})), 'a Chrome user agent without Accept-Language is a crawler');
  const verified = browserRequest({ 'accept-language': 'en-US' });
  Object.defineProperty(verified, 'cf', { value: { verifiedBotCategory: 'Search Engine Crawler' } });
  assert.ok(isBotRequest(verified), 'Cloudflare verified bots are skipped');
  assert.equal(deviceOf('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)'), 'tablet');
  console.log('D1 integration passed: CRUD, visibility, private tables, identifier validation, atomic bulk rollback, stable IDs, arrays/booleans, project type schema and placement, photo framing, reordering, visit analytics.');
} finally { await platform.dispose(); await rm(directory, { recursive: true, force: true }); }
