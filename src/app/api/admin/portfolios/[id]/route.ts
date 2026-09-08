import { NextRequest, NextResponse } from 'next/server';
import { createAdminDb } from '@/lib/database';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const contentDb = createAdminDb();

  const { data, error } = await contentDb
    .from('portfolios')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const contentDb = createAdminDb();
  const body = await request.json();

  const { data, error } = await contentDb
    .from('portfolios')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const contentDb = createAdminDb();

  const { error } = await contentDb
    .from('portfolios')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
