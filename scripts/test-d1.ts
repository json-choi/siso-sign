import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getPlatformProxy } from 'wrangler';
import type { D1Database } from '@cloudflare/workers-types';
import { databaseClient } from '../src/lib/database-core';

const directory = await mkdtemp(join(tmpdir(), 'siso-d1-test-'));
const configPath = join(directory, 'wrangler.json');
await writeFile(configPath, JSON.stringify({ name: 'siso-d1-test', compatibility_date: '2026-09-08', d1_databases: [{ binding: 'DB', database_name: 'test', database_id: 'local-test' }] }));
const platform = await getPlatformProxy<{ DB: D1Database }>({ configPath, persist: { path: join(directory, 'state') } });
try {
  const sql = await readFile(new URL('../d1-migrations/0001_application.sql', import.meta.url), 'utf8');
  // The API's exec accepts a complete SQLite script, including trigger bodies.
  for (const statement of sql.split(/;\n\n/)) {
    if (statement.trim()) await platform.env.DB.prepare(statement).run();
  }
  const admin = databaseClient(platform.env.DB, true);
  const publicDb = databaseClient(platform.env.DB);
  const inserted = await admin.from('portfolios').insert({ title: '복원 테스트', images: ['one.webp','two.webp'], tags: ['한글'], is_published: false }).single();
  assert.equal(inserted.error, null); assert.ok(inserted.data);
  assert.equal(inserted.data.is_published, false); assert.deepEqual(inserted.data.images, ['one.webp','two.webp']);
  assert.equal((await publicDb.from('portfolios').select()).data?.length, 0);
  await admin.from('portfolios').update({ is_published: true }).eq('id', inserted.data.id);
  assert.equal((await publicDb.from('portfolios').select()).data?.length, 1);
  assert.throws(() => publicDb.from('admin_password'));
  assert.throws(() => publicDb.from('portfolios').delete());
  assert.throws(() => admin.from('portfolios').eq('id; DROP TABLE portfolios', 'x'));
  assert.ok((await admin.from('portfolios').delete()).error);
  const setting = await admin.from('site_settings').insert({ key: 'sample', value: 'old' }).single();
  assert.ok(setting.data);
  const failed = await admin.from('site_settings').upsert([{ key: 'sample', value: 'changed' }, { key: null, value: 'invalid' }], { onConflict: 'key' });
  assert.ok(failed.error);
  const unchanged = await admin.from('site_settings').eq('key', 'sample').single();
  assert.equal(unchanged.data?.value, 'old');
  await admin.from('site_settings').upsert([{ key: 'sample', value: 'new' }], { onConflict: 'key' });
  const updated = await admin.from('site_settings').eq('key', 'sample').single();
  assert.equal(updated.data?.id, setting.data.id); assert.equal(updated.data?.value, 'new');
  await admin.from('portfolios').delete().eq('id', inserted.data.id);
  assert.equal((await admin.from('portfolios').select('*', { count: 'exact' })).count, 0);
  console.log('D1 integration passed: CRUD, visibility, private tables, identifier validation, atomic bulk rollback, stable IDs, arrays/booleans.');
} finally { await platform.dispose(); await rm(directory, { recursive: true, force: true }); }
