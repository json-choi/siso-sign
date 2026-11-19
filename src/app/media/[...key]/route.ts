import { env } from 'cloudflare:workers';
import { MEDIA_WIDTHS } from '@/lib/media';

// Keys are random per upload and never overwritten, so responses can be cached for good.
const IMMUTABLE = 'public, max-age=31536000, immutable';
const RESIZABLE = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export async function GET(request: Request, context: { params: Promise<{ key: string[] }> }): Promise<Response> {
  const { key } = await context.params;
  if (!key.length || key.some(part => !part || part === '.' || part === '..' || part.includes('\0'))) return new Response(null, { status: 404 });

  const url = new URL(request.url);
  const width = Number(url.searchParams.get('w'));
  if (url.searchParams.has('w') && !(MEDIA_WIDTHS as readonly number[]).includes(width)) {
    return new Response('Unsupported width', { status: 400 });
  }

  if (width) {
    const resized = await resizedResponse(request, key.join('/'), width);
    if (resized) return resized;
  }
  return originalResponse(request, key.join('/'));
}

async function originalResponse(request: Request, key: string): Promise<Response> {
  const object = await env.MEDIA.get(key);
  if (!object) return new Response(null, { status: 404 });
  const headers = new Headers({
    'Content-Type': object.httpMetadata?.contentType ?? 'application/octet-stream',
    'Cache-Control': IMMUTABLE,
    'ETag': object.httpEtag,
    'X-Content-Type-Options': 'nosniff',
  });
  if (request.headers.get('if-none-match') === object.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(object.body as unknown as ReadableStream, { headers });
}

/** Resized WebP (or JPEG for browsers without WebP), cached at the edge. Null means serve the original. */
async function resizedResponse(request: Request, key: string, width: number): Promise<Response | null> {
  const format = (request.headers.get('accept') ?? '').includes('image/webp') ? 'image/webp' : 'image/jpeg';
  const cacheUrl = new URL(request.url);
  cacheUrl.search = `?w=${width}&f=${format === 'image/webp' ? 'webp' : 'jpeg'}`;
  const cacheKey = new Request(cacheUrl.toString());
  const cache = (globalThis.caches as unknown as { default?: Cache } | undefined)?.default;

  const cached = await cache?.match(cacheKey);
  if (cached) return cached;

  const object = await env.MEDIA.get(key);
  if (!object) return new Response(null, { status: 404 });
  // GIFs may be animated and SVGs are not raster; leave them untouched.
  if (!RESIZABLE.has(object.httpMetadata?.contentType ?? '')) return null;

  try {
    const output = await env.IMAGES.input(object.body)
      .transform({ width, fit: 'scale-down' })
      .output({ format, quality: 80 });
    const body = await output.response().arrayBuffer();
    const headers = new Headers({
      'Content-Type': format,
      'Cache-Control': IMMUTABLE,
      'Vary': 'Accept',
      'X-Content-Type-Options': 'nosniff',
    });
    await cache?.put(cacheKey, new Response(body, { headers }));
    return new Response(body, { headers });
  } catch (error) {
    console.error('Image resize failed', key, width, error);
    return null;
  }
}
