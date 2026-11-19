import type { D1Database } from '@cloudflare/workers-types';

/**
 * Privacy-friendly visit analytics stored in D1. No cookies: a visitor is a
 * salted hash of IP and user agent that changes every day, so unique visitors
 * can be counted per day without following anyone across days.
 */

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS "page_views" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "day" TEXT NOT NULL,
    "ts" INTEGER NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'view',
    "path" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "campaign" TEXT,
    "device" TEXT NOT NULL,
    "country" TEXT,
    "visitor" TEXT NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS "idx_page_views_day" ON "page_views" ("day", "kind")',
];
const RETENTION_DAYS = 400;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

const ready = new WeakMap<D1Database, Promise<void>>();
export function ensureAnalyticsSchema(database: D1Database): Promise<void> {
  let promise = ready.get(database);
  if (!promise) {
    promise = database.batch(SCHEMA.map((sql) => database.prepare(sql))).then(() => undefined);
    promise.catch(() => ready.delete(database));
    ready.set(database, promise);
  }
  return promise;
}

/** Calendar day in Korea for a timestamp, as YYYY-MM-DD. */
export function kstDay(ms: number): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10);
}

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|meta-externalagent|preview|monitor|curl|wget|python|headless|lighthouse|pingdom|uptime|scan/i;

export function isBot(userAgent: string): boolean {
  return !userAgent || BOT.test(userAgent);
}

export function deviceOf(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return 'tablet';
  if (/mobi|iphone|android/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

const SOURCE_HOSTS: [RegExp, string][] = [
  [/(^|\.)instagram\.com$|^l\.instagram\.com$/, 'instagram'],
  [/(^|\.)facebook\.com$|^fb\.me$|^l\.facebook\.com$|^m\.facebook\.com$/, 'facebook'],
  [/(^|\.)naver\.com$/, 'naver'],
  [/(^|\.)google\./, 'google'],
  [/(^|\.)daum\.net$|(^|\.)kakao\.com$/, 'kakao'],
  [/(^|\.)youtube\.com$|^youtu\.be$/, 'youtube'],
  [/(^|\.)bing\.com$/, 'bing'],
];

/** Where a visit came from: utm_source when tagged, else the referring site, else direct. */
export function sourceOf(url: URL, referrer: string | null): string {
  const utm = url.searchParams.get('utm_source')?.trim().toLowerCase();
  if (utm) return utm.slice(0, 40);
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host === url.hostname.replace(/^www\./, '')) return 'internal';
    return SOURCE_HOSTS.find(([pattern]) => pattern.test(host))?.[1] ?? host.slice(0, 60);
  } catch {
    return 'direct';
  }
}

async function visitorHash(salt: string, day: string, ip: string, userAgent: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}|${day}|${ip}|${userAgent}`);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
  return Array.from(digest.slice(0, 10), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface VisitInput {
  kind: 'view' | 'contact';
  path: string;
  url: URL;
  referrer: string | null;
  userAgent: string;
  ip: string;
  country: string | null;
  salt: string;
  now?: number;
}

export async function recordVisit(database: D1Database, input: VisitInput): Promise<void> {
  const now = input.now ?? Date.now();
  const day = kstDay(now);
  await ensureAnalyticsSchema(database);
  const visitor = await visitorHash(input.salt, day, input.ip, input.userAgent);
  const campaign = input.url.searchParams.get('utm_campaign')?.slice(0, 80) ?? null;
  await database
    .prepare('INSERT INTO "page_views" ("day","ts","kind","path","source","campaign","device","country","visitor") VALUES (?,?,?,?,?,?,?,?,?)')
    .bind(day, now, input.kind, input.path.slice(0, 200), sourceOf(input.url, input.referrer), campaign, deviceOf(input.userAgent), input.country, visitor)
    .run();
  // Trim old rows now and then instead of on a schedule.
  if (Math.random() < 0.01) {
    await database.prepare('DELETE FROM "page_views" WHERE "day" < ?').bind(kstDay(now - RETENTION_DAYS * 86_400_000)).run();
  }
}

export interface DailyPoint {
  day: string;
  visitors: number;
  views: number;
}

export interface Ranked {
  key: string;
  count: number;
}

export interface AnalyticsSummary {
  from: string;
  to: string;
  visitors: number;
  views: number;
  contacts: number;
  previous: { visitors: number; views: number; contacts: number };
  daily: DailyPoint[];
  pages: Ranked[];
  sources: Ranked[];
  devices: Ranked[];
  contactChannels: Ranked[];
}

/** Totals for the last `days` days (today included, in Korean time) and the period before. */
export async function summarize(database: D1Database, days: number, now = Date.now()): Promise<AnalyticsSummary> {
  await ensureAnalyticsSchema(database);
  const to = kstDay(now);
  const from = kstDay(now - (days - 1) * 86_400_000);
  const prevFrom = kstDay(now - (2 * days - 1) * 86_400_000);
  const prevTo = kstDay(now - days * 86_400_000);

  const totals = (start: string, end: string) => database.prepare(
    `SELECT
      (SELECT COUNT(*) FROM (SELECT DISTINCT "day","visitor" FROM "page_views" WHERE "kind"='view' AND "day" BETWEEN ?1 AND ?2)) AS visitors,
      (SELECT COUNT(*) FROM "page_views" WHERE "kind"='view' AND "day" BETWEEN ?1 AND ?2) AS views,
      (SELECT COUNT(*) FROM "page_views" WHERE "kind"='contact' AND "day" BETWEEN ?1 AND ?2) AS contacts`,
  ).bind(start, end);
  const ranked = (column: 'path' | 'source' | 'device', kind: string, limit: number) => database.prepare(
    `SELECT "${column}" AS key, COUNT(${column === 'path' ? '*' : 'DISTINCT "day" || "visitor"'}) AS count
     FROM "page_views" WHERE "kind"=? AND "day" BETWEEN ? AND ? ${column === 'source' ? `AND "source" <> 'internal'` : ''}
     GROUP BY key ORDER BY count DESC LIMIT ${limit}`,
  ).bind(kind, from, to);

  const [current, previous, daily, pages, sources, devices, contactChannels] = await database.batch<Record<string, unknown>>([
    totals(from, to),
    totals(prevFrom, prevTo),
    database.prepare(
      `SELECT "day", COUNT(DISTINCT "visitor") AS visitors, COUNT(*) AS views
       FROM "page_views" WHERE "kind"='view' AND "day" BETWEEN ? AND ? GROUP BY "day"`,
    ).bind(from, to),
    ranked('path', 'view', 8),
    ranked('source', 'view', 8),
    ranked('device', 'view', 3),
    database.prepare(
      `SELECT "path" AS key, COUNT(*) AS count FROM "page_views" WHERE "kind"='contact' AND "day" BETWEEN ? AND ? GROUP BY key ORDER BY count DESC`,
    ).bind(from, to),
  ]);

  const byDay = new Map(daily.results.map((row) => [String(row.day), { visitors: Number(row.visitors), views: Number(row.views) }]));
  const series: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const day = kstDay(now - i * 86_400_000);
    series.push({ day, ...(byDay.get(day) ?? { visitors: 0, views: 0 }) });
  }
  const list = (rows: Record<string, unknown>[]): Ranked[] => rows.map((row) => ({ key: String(row.key), count: Number(row.count) }));
  const total = (rows: Record<string, unknown>[], key: string) => Number(rows[0]?.[key] ?? 0);

  return {
    from,
    to,
    visitors: total(current.results, 'visitors'),
    views: total(current.results, 'views'),
    contacts: total(current.results, 'contacts'),
    previous: {
      visitors: total(previous.results, 'visitors'),
      views: total(previous.results, 'views'),
      contacts: total(previous.results, 'contacts'),
    },
    daily: series,
    pages: list(pages.results),
    sources: list(sources.results),
    devices: list(devices.results),
    contactChannels: list(contactChannels.results),
  };
}
