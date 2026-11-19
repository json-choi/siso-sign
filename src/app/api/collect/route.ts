import { NextRequest, NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';
import { isBot, recordVisit } from '@/lib/analytics';

const CHANNEL = /^[a-z0-9_-]{1,30}$/;

/** Records a click on a contact link (phone, email, Instagram, KakaoTalk...). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  const channel = body && typeof body === 'object' && 'channel' in body ? String(body.channel).toLowerCase() : '';
  const userAgent = request.headers.get('user-agent') ?? '';
  if (!CHANNEL.test(channel)) return NextResponse.json({ error: 'invalid channel' }, { status: 400 });
  if (isBot(userAgent)) return new NextResponse(null, { status: 204 });
  const referrer = request.headers.get('referer');
  try {
    await recordVisit(env.DB, {
      kind: 'contact',
      path: channel,
      url: new URL(referrer ?? request.url),
      referrer: null,
      userAgent,
      ip: request.headers.get('cf-connecting-ip') ?? '',
      country: null,
      salt: process.env.SUPABASE_JWT_SECRET ?? 'siso-sign',
    });
  } catch (error) {
    console.error('collect', error);
  }
  return new NextResponse(null, { status: 204 });
}
