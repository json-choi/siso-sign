import { NextRequest, NextResponse } from 'next/server';
import { createAdminDb } from '@/lib/database';

export async function GET() {
  const contentDb = createAdminDb();
  
  const { data, error } = await contentDb
    .from('social_links')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const contentDb = createAdminDb();
  const body = await request.json();

  const { data, error } = await contentDb
    .from('social_links')
    .insert(body)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
