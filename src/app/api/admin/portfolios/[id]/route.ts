import { NextRequest, NextResponse } from 'next/server';
import { createAdminDb } from '@/lib/database';
import { parsePortfolioInput } from '@/lib/portfolio-input';

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
  const parsed = parsePortfolioInput(await request.json().catch(() => null), { requireTitle: false });
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  if (!Object.keys(parsed.data).length) {
    return NextResponse.json({ error: '변경할 내용이 없습니다.' }, { status: 400 });
  }
  const contentDb = createAdminDb();

  const { data, error } = await contentDb
    .from('portfolios')
    .update(parsed.data)
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
