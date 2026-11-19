import { recordVisit, isBot } from '@/lib/analytics';
import type { D1Database } from '@cloudflare/workers-types';

interface TrackingEnv {
  DB: D1Database;
  SUPABASE_JWT_SECRET?: string;
}

const SKIP = /^\/(admin|api|media|_next|_vinext)(\/|$)/;

/**
 * Records a page view for a successful page request: a full HTML load or a
 * client-side navigation (RSC). Prefetches, bots, assets, API and admin
 * requests are ignored. Failures never affect the response.
 */
export async function trackPageView(request: Request, response: Response, env: TrackingEnv): Promise<void> {
  if (request.method !== 'GET' || response.status !== 200) return;
  const url = new URL(request.url);
  const path = url.pathname;
  if (SKIP.test(path) || /\.[a-z0-9]+$/i.test(path) || path.includes('opengraph-image')) return;
  if (request.headers.get('next-router-prefetch') || request.headers.get('purpose') === 'prefetch' || request.headers.get('sec-purpose')?.includes('prefetch')) return;
  const isRsc = request.headers.get('rsc') === '1' || url.searchParams.has('_rsc');
  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html');
  if (!isRsc && !isHtml) return;
  const userAgent = request.headers.get('user-agent') ?? '';
  if (isBot(userAgent)) return;

  await recordVisit(env.DB, {
    kind: 'view',
    path,
    url,
    referrer: request.headers.get('referer'),
    userAgent,
    ip: request.headers.get('cf-connecting-ip') ?? '',
    country: (request as Request & { cf?: { country?: string } }).cf?.country ?? null,
    salt: env.SUPABASE_JWT_SECRET ?? 'siso-sign',
  });
}
