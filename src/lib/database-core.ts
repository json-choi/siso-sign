import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import type { Portfolio, PortfolioPlacement, Service, SiteSetting, SocialLink } from '@/types/database';
import { isProjectType } from '@/lib/project-types';

type Rows = {
  portfolios: Portfolio;
  services: Service;
  site_settings: SiteSetting;
  social_links: SocialLink;
  admin_password: { id: string; password_hash: string; created_at: string; updated_at: string };
};
type Table = keyof Rows;
type Result<T> = { data: T | null; error: { message: string } | null; count: number | null };
const columns: Record<Table, string[]> = {
  portfolios: ['id','title','description','category','project_type','image_url','images','thumbnail_url','tags','is_featured','is_published','sort_order','created_at','updated_at'],
  services: ['id','title','description','icon','sort_order','is_active','created_at','updated_at'],
  site_settings: ['id','key','value','type','description','updated_at'],
  social_links: ['id','platform','url','icon','sort_order','is_active','created_at'],
  admin_password: ['id','password_hash','created_at','updated_at'],
};
const jsonColumns = new Set(['images','tags']);
const booleanColumns = new Set(['is_featured','is_published','is_active']);
function encode(value: unknown): string | number | null {
  if (value === null) return null;
  if (typeof value === 'boolean') return Number(value);
  if (Array.isArray(value) && value.every(v => typeof v === 'string')) return JSON.stringify(value);
  if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) return value;
  throw new Error('지원하지 않는 데이터 형식입니다.');
}
function decode<T extends Table>(row: Record<string, unknown>): Rows[T] {
  return Object.fromEntries(Object.entries(row).map(([key,value]) => [key,
    value === null ? null : jsonColumns.has(key) ? JSON.parse(String(value)) : booleanColumns.has(key) ? Boolean(value) : value,
  ])) as unknown as Rows[T];
}
const PROJECT_TYPE_COLUMN = `ALTER TABLE "portfolios" ADD COLUMN "project_type" TEXT CHECK ("project_type" IS NULL OR "project_type" IN ('commercial','retail'))`;
const schemaReady = new WeakMap<D1Database, Promise<void>>();
async function hasProjectType(database: D1Database): Promise<boolean> {
  const { results } = await database.prepare('PRAGMA table_info("portfolios")').all<{ name: string }>();
  return results.some(column => column.name === 'project_type');
}
/**
 * Adds columns introduced after the initial D1 import. Production schema changes are not applied by CI,
 * so admin writes add them on first use. Concurrent isolates may race; a duplicate column is success.
 */
export function ensureSchema(database: D1Database): Promise<void> {
  let ready = schemaReady.get(database);
  if (!ready) {
    ready = (async () => {
      if (await hasProjectType(database)) return;
      try {
        await database.prepare(PROJECT_TYPE_COLUMN).run();
      } catch (error) {
        if (!(await hasProjectType(database))) throw error;
      }
    })();
    ready.catch(() => schemaReady.delete(database));
    schemaReady.set(database, ready);
  }
  return ready;
}
class Query<T extends Table> implements PromiseLike<Result<Rows[T][]>> {
  private filters: string[] = [];
  private bindings: (string | number | null)[] = [];
  private sorting: string[] = [];
  private rowLimit: number | undefined;
  private countRequested = false;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private input: Record<string, unknown>[] = [];
  constructor(private database: D1Database, private table: T, private admin: boolean) {
    if (!admin) {
      if (table === 'admin_password') throw new Error('비공개 테이블입니다.');
      if (table === 'portfolios') this.eq('is_published', true);
      if (table === 'services' || table === 'social_links') this.eq('is_active', true);
    }
  }
  private column(name: string): string {
    if (!columns[this.table].includes(name)) throw new Error('유효하지 않은 필드입니다.');
    return `"${name}"`;
  }
  select(_fields = '*', options?: { count: 'exact' }) { this.countRequested = options?.count === 'exact'; return this; }
  eq(name: string, value: unknown) { this.filters.push(`${this.column(name)} IS ?`); this.bindings.push(encode(value)); return this; }
  like(name: string, pattern: string) { this.filters.push(`${this.column(name)} LIKE ?`); this.bindings.push(pattern); return this; }
  neq(name: string, value: unknown) { this.filters.push(`${this.column(name)} IS NOT ?`); this.bindings.push(encode(value)); return this; }
  in(name: string, values: unknown[]) {
    this.filters.push(values.length ? `${this.column(name)} IN (${values.map(() => '?').join(',')})` : '0');
    this.bindings.push(...values.map(encode)); return this;
  }
  order(name: string, options: { ascending: boolean }) { this.sorting.push(`${this.column(name)} ${options.ascending ? 'ASC' : 'DESC'}`); return this; }
  limit(count: number) { if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid limit'); this.rowLimit = count; return this; }
  private write(operation: typeof this.operation, values: unknown) {
    if (!this.admin) throw new Error('읽기 전용 연결입니다.');
    const rows = Array.isArray(values) ? values : [values];
    this.input = rows.map(value => {
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('유효하지 않은 데이터입니다.');
      return Object.fromEntries(Object.entries(value).map(([key,val]) => { this.column(key); return [key,val]; }));
    });
    this.operation = operation; return this;
  }
  insert(values: unknown) { return this.write('insert', values); }
  update(values: unknown) { return this.write('update', values); }
  upsert(values: unknown, options: { onConflict: string }) {
    if (this.table !== 'site_settings' || options.onConflict !== 'key') throw new Error('Unsupported conflict target');
    return this.write('upsert', values);
  }
  delete() { if (!this.admin) throw new Error('읽기 전용 연결입니다.'); this.operation = 'delete'; return this; }
  private async execute(): Promise<Result<Rows[T][]>> {
    try {
      if (this.admin && this.table === 'portfolios') await ensureSchema(this.database);
      const table = `"${this.table}"`;
      const where = this.filters.length ? ` WHERE ${this.filters.join(' AND ')}` : '';
      let statements: D1PreparedStatement[];
      if (this.operation === 'select') {
        const order = this.sorting.length ? ` ORDER BY ${this.sorting.join(',')}` : '';
        const limit = this.rowLimit === undefined ? '' : ` LIMIT ${this.rowLimit}`;
        statements = [this.database.prepare(`SELECT * FROM ${table}${where}${order}${limit}`).bind(...this.bindings)];
      } else if (this.operation === 'delete') {
        if (!where) throw new Error('삭제 조건이 필요합니다.');
        statements = [this.database.prepare(`DELETE FROM ${table}${where} RETURNING *`).bind(...this.bindings)];
      } else if (this.operation === 'update') {
        if (!where || this.input.length !== 1) throw new Error('수정 조건이 필요합니다.');
        const entries = Object.entries(this.input[0]);
        statements = [this.database.prepare(`UPDATE ${table} SET ${entries.map(([key]) => `${this.column(key)} = ?`).join(',')}${where} RETURNING *`).bind(...entries.map(([,v]) => encode(v)), ...this.bindings)];
      } else {
        statements = this.input.map(row => {
          const entries = Object.entries(row);
          const conflict = this.operation === 'upsert' ? ` ON CONFLICT("key") DO UPDATE SET ${entries.filter(([key]) => !['id','key'].includes(key)).map(([key]) => `${this.column(key)} = excluded.${this.column(key)}`).join(',')}` : '';
          return this.database.prepare(`INSERT INTO ${table} (${entries.map(([key]) => this.column(key)).join(',')}) VALUES (${entries.map(() => '?').join(',')})${conflict} RETURNING *`).bind(...entries.map(([,v]) => encode(v)));
        });
      }
      if (!statements.length) return { data: [], error: null, count: this.countRequested ? 0 : null };
      const results = await this.database.batch<Record<string, unknown>>(statements);
      const data = results.flatMap(result => result.results.map(row => decode<T>(row)));
      return { data, error: null, count: this.countRequested ? data.length : null };
    } catch {
      return { data: null, error: { message: '데이터베이스 요청에 실패했습니다.' }, count: null };
    }
  }
  async single(): Promise<Result<Rows[T]>> {
    const result = await this.execute();
    if (result.error) return { ...result, data: null };
    return result.data?.length === 1 ? { ...result, data: result.data[0] } : { data: null, error: { message: '결과가 한 건이 아닙니다.' }, count: null };
  }
  then<R1 = Result<Rows[T][]>, R2 = never>(fulfilled?: ((value: Result<Rows[T][]>) => R1 | PromiseLike<R1>) | null, rejected?: ((reason: unknown) => R2 | PromiseLike<R2>) | null): Promise<R1 | R2> {
    return this.execute().then(fulfilled, rejected);
  }
}
/** Moves portfolios between project types and reorders them in one atomic batch. */
function isPlacement(value: unknown): value is PortfolioPlacement {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && item.id.length > 0 &&
    (item.project_type === null || isProjectType(item.project_type)) &&
    Number.isSafeInteger(item.sort_order);
}
async function placePortfolios(database: D1Database, input: unknown[]): Promise<{ error: { message: string } | null }> {
  const placements = input.filter(isPlacement);
  if (placements.length !== input.length || new Set(placements.map(item => item.id)).size !== placements.length) {
    return { error: { message: '유효하지 않은 정렬 데이터입니다.' } };
  }
  if (!placements.length) return { error: null };
  try {
    await ensureSchema(database);
    const ids = placements.map(item => item.id);
    const found = await database.prepare(`SELECT COUNT(*) AS "count" FROM "portfolios" WHERE "id" IN (${ids.map(() => '?').join(',')})`).bind(...ids).first<{ count: number }>();
    if (found?.count !== ids.length) return { error: { message: '삭제되었거나 없는 프로젝트가 있습니다. 새로고침 후 다시 시도하세요.' } };
    await database.batch(placements.map(item =>
      database.prepare('UPDATE "portfolios" SET "project_type" = ?, "sort_order" = ? WHERE "id" = ?').bind(item.project_type, item.sort_order, item.id)));
    return { error: null };
  } catch {
    return { error: { message: '정렬을 저장하지 못했습니다.' } };
  }
}
/** Rewrites sort_order for services or social links in one atomic batch. */
async function reorder(database: D1Database, table: 'services' | 'social_links', input: unknown[]): Promise<{ error: { message: string } | null }> {
  const ids = input.filter((id): id is string => typeof id === 'string' && id.length > 0);
  if (ids.length !== input.length || new Set(ids).size !== ids.length) return { error: { message: '유효하지 않은 정렬 데이터입니다.' } };
  if (!ids.length) return { error: null };
  try {
    const found = await database.prepare(`SELECT COUNT(*) AS "count" FROM "${table}" WHERE "id" IN (${ids.map(() => '?').join(',')})`).bind(...ids).first<{ count: number }>();
    if (found?.count !== ids.length) return { error: { message: '삭제되었거나 없는 항목이 있습니다. 새로고침 후 다시 시도하세요.' } };
    await database.batch(ids.map((id, index) => database.prepare(`UPDATE "${table}" SET "sort_order" = ? WHERE "id" = ?`).bind(index, id)));
    return { error: null };
  } catch {
    return { error: { message: '순서를 저장하지 못했습니다.' } };
  }
}
export function databaseClient(database: D1Database, admin = false) {
  return {
    from: <T extends Table>(table: T) => new Query(database, table, admin),
    placePortfolios: (placements: unknown[]) => {
      if (!admin) throw new Error('읽기 전용 연결입니다.');
      return placePortfolios(database, placements);
    },
    /** `ids` in their new order; each gets its index as sort_order. */
    reorder: (table: 'services' | 'social_links', ids: unknown[]) => {
      if (!admin) throw new Error('읽기 전용 연결입니다.');
      return reorder(database, table, ids);
    },
  };
}
