import { NextRequest, NextResponse } from 'next/server';
import { createAdminDb } from '@/lib/database';

export async function GET() {
  const contentDb = createAdminDb();
  
  const { data, error } = await contentDb
    .from('site_settings')
    .select('*')
    .order('key', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const contentDb = createAdminDb();
  const body = await request.json();
  const settings = Array.isArray(body) ? body : [body];
  
  const { data, error } = await contentDb
    .from('site_settings')
    .upsert(settings, { onConflict: 'key' })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const contentDb = createAdminDb();
  const body = await request.json();
  const { key, value } = body;

  const { data: existing } = await contentDb
    .from('site_settings')
    .select('id')
    .eq('key', key)
    .single();

  if (!existing) {
    const { data, error } = await contentDb
      .from('site_settings')
      .insert({ key, value, type: 'text', description: key })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await contentDb
    .from('site_settings')
    .update({ value })
    .eq('key', key)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
