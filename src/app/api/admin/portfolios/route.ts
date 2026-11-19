import { NextRequest, NextResponse } from 'next/server';
import { createAdminDb } from '@/lib/database';
import { parsePortfolioInput } from '@/lib/portfolio-input';

export async function GET(): Promise<NextResponse> {
  const { data, error } = await createAdminDb()
    .from('portfolios')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const parsed = parsePortfolioInput(await request.json().catch(() => null), { requireTitle: true });
  if ('error' in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const contentDb = createAdminDb();
  const input = parsed.data;

  // New projects go to the end of their group unless an order is given.
  if (!('sort_order' in input)) {
    const { data: siblings, error } = await contentDb
      .from('portfolios')
      .select('sort_order')
      .eq('project_type', input.project_type ?? null);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    input.sort_order = (siblings ?? []).reduce((max, row) => Math.max(max, row.sort_order + 1), 0);
  }

  const { data, error } = await contentDb
    .from('portfolios')
    .insert(input)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
