import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';
import type { Portfolio, Service, SiteSetting, SocialLink } from '@/types/database';

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
  portfolios: ['id','title','description','category','image_url','images','thumbnail_url','tags','is_featured','is_published','sort_order','created_at','updated_at'],
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
export function databaseClient(database: D1Database, admin = false) {
  return { from: <T extends Table>(table: T) => new Query(database, table, admin) };
}
