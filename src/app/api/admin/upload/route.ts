import { NextRequest, NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';
import { isAuthenticated } from '@/lib/auth';

const MAX_BYTES = 20 * 1024 * 1024;
/** Longest edge kept in the stored WebP; display sizes are cut from it on request. */
const MASTER_EDGE = 3840;
const MASTER_QUALITY = 90;
const ACCEPTED = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'],
  ['image/avif', 'avif'], ['image/heic', 'heic'], ['image/heif', 'heif'], ['image/gif', 'gif'],
]);

/** iOS can send HEIC photos without a MIME type. */
function guessType(name: string): string {
  return /\.heic$/i.test(name) ? 'image/heic' : /\.heif$/i.test(name) ? 'image/heif' : '';
}

/**
 * Stores the untouched upload under originals/ and a high-quality WebP master
 * under portfolios/, which the site serves and resizes. GIFs are kept as they
 * are because they may be animated. If conversion fails the original is served.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await request.formData();
    const file = data.get('file');
    const extension = file instanceof File ? ACCEPTED.get(file.type || guessType(file.name)) : undefined;
    if (!(file instanceof File) || !extension) {
      return NextResponse.json({ error: 'JPG, PNG, WebP, HEIC, GIF 사진을 선택해주세요.' }, { status: 400 });
    }
    if (!file.size || file.size > MAX_BYTES) {
      return NextResponse.json({ error: '사진은 20MB 이하만 올릴 수 있습니다.' }, { status: 413 });
    }

    const id = crypto.randomUUID();
    const original = await file.arrayBuffer();
    const contentType = file.type || guessType(file.name);
    // Originals keep full quality and camera metadata; the media route never serves them.
    await env.MEDIA.put(`originals/${id}.${extension}`, original, { httpMetadata: { contentType } });

    if (contentType !== 'image/gif') {
      try {
        // Images reads EXIF orientation and drops other metadata such as GPS location.
        const output = await env.IMAGES.input(new Blob([original]).stream() as unknown as Parameters<typeof env.IMAGES.input>[0])
          .transform({ width: MASTER_EDGE, height: MASTER_EDGE, fit: 'scale-down' })
          .output({ format: 'image/webp', quality: MASTER_QUALITY });
        const webp = await output.response().arrayBuffer();
        const key = `portfolios/${id}.webp`;
        await env.MEDIA.put(key, webp, { httpMetadata: { contentType: 'image/webp' } });
        return NextResponse.json({ publicUrl: `/media/${key}` });
      } catch (error) {
        console.error('WebP conversion failed; serving the original', error);
      }
    }

    const key = `portfolios/${id}.${extension}`;
    await env.MEDIA.put(key, original, { httpMetadata: { contentType } });
    return NextResponse.json({ publicUrl: `/media/${key}` });
  } catch {
    return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 });
  }
}
