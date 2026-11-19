import { NextRequest, NextResponse } from 'next/server';
import { createAdminDb } from '@/lib/database';

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json().catch(() => null);
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: '정렬 데이터가 필요합니다.' }, { status: 400 });
  }

  const { error } = await createAdminDb().reorder('services', body);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
