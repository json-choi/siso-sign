import { NextRequest, NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';
import { isAuthenticated } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const data = await request.formData();
    const file = data.get('file');
    if (!(file instanceof File) || !['image/webp','image/png','image/jpeg','image/gif','image/avif'].includes(file.type)) {
      return NextResponse.json({ error: '지원하는 이미지 파일을 선택해주세요.' }, { status: 400 });
    }
    if (!file.size || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: '압축된 이미지 크기는 10MB 이하여야 합니다.' }, { status: 413 });
    const extension = file.type.split('/')[1];
    const key = `portfolios/${crypto.randomUUID()}.${extension}`;
    await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
    return NextResponse.json({ publicUrl: `/media/${key}` });
  } catch {
    return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 });
  }
}
