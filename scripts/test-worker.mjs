import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Stub only the framework handler; execute the actual production Worker router.
const handlerStub = 'data:text/javascript,' + encodeURIComponent(
  'export default { fetch(request) { return new Response(new URL(request.url).pathname); } };'
);
const analyticsStub = 'data:text/javascript,' + encodeURIComponent(
  'export async function trackPageView(request) { globalThis.tracked = (globalThis.tracked ?? []).concat(new URL(request.url).pathname); }'
);
const ctx = { waits: [], waitUntil(promise) { this.waits.push(promise); } };
const source = await readFile(new URL('../worker.js', import.meta.url), 'utf8');
const { default: worker } = await import('data:text/javascript,' + encodeURIComponent(
  source
    .replace('"vinext/server/fetch-handler"', JSON.stringify(handlerStub))
    .replace('"./src/lib/analytics-worker"', JSON.stringify(analyticsStub))
));

test('bundled CSS and JavaScript reach the asset binding', async () => {
  for (const path of ['/_next/static/css/site.css', '/_next/static/chunks/app.js']) {
    const request = new Request('https://www.siso-sign.com' + path);
    const expected = new Response('asset');
    const response = await worker.fetch(request, {
      ASSETS: { fetch(actual) { assert.equal(actual, request); return expected; } },
    }, {});
    assert.equal(response, expected);
  }
});

test('admin, media, and image optimization stay behind the application handler', async () => {
  for (const path of ['/admin/dashboard', '/api/admin/settings', '/media/example.jpg', '/_next/image']) {
    const response = await worker.fetch(new Request('https://www.siso-sign.com' + path), {
      ASSETS: { fetch() { assert.fail('Application routes must not bypass the handler'); } },
    }, ctx);
    assert.equal(await response.text(), path);
  }
});

test('apex redirect preserves path and query and uses permanent HTTPS', async () => {
  const response = await worker.fetch(new Request('http://siso-sign.com/work/example?from=search'), {}, {});
  assert.equal(response.status, 308);
  assert.equal(response.headers.get('location'), 'https://www.siso-sign.com/work/example?from=search');
});

test('application responses are handed to visit analytics without delaying them', async () => {
  globalThis.tracked = [];
  const response = await worker.fetch(new Request('https://www.siso-sign.com/work'), {}, ctx);
  assert.equal(await response.text(), '/work');
  await Promise.all(ctx.waits);
  assert.deepEqual(globalThis.tracked, ['/work']);
});
