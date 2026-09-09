This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Search and advertising integrations

- The canonical production URL is `https://www.siso-sign.com`.
- Google Search Console verification is rendered from the root metadata.
- Set `NAVER_SITE_VERIFICATION` to the `content` value issued by Naver Search Advisor.
- Set `NEXT_PUBLIC_META_PIXEL_ID` to enable the consent-gated Meta Pixel integration.
- Meta `PageView` events are sent after marketing consent, and email/phone actions send the standard `Contact` event.
- Search engine sitemaps are available at `/sitemap.xml`; crawler rules are available at `/robots.txt`.

Copy `.env.example` to `.env.local` and fill in the values needed for the current environment.

## Development and deployment

The application runs on Cloudflare Workers using vinext. Application data is in
D1, uploads are in R2, and static files and image optimization are served through
Cloudflare bindings. Supabase credentials are no longer required.

Use Node.js 24 and pnpm 10.15.0:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm exec tsc --noEmit
pnpm test:d1
pnpm build
```

Local D1 tests use a temporary isolated database. For local Workers secrets, put
`ADMIN_PASSWORD` and `SUPABASE_JWT_SECRET` in `.dev.vars` (git-ignored). Preserve
the existing JWT secret: it also salts stored admin password hashes.

Pushing to `main` runs `.github/workflows/cloudflare.yml`: type checks, D1 tests,
build, then deployment using the protected `cloudflare-production` environment.
The workflow uses its existing `CLOUDFLARE_API_TOKEN` secret and
`CLOUDFLARE_ACCOUNT_ID` variable. Runtime secrets remain configured on the Worker.
Manual deployment: `pnpm deploy:vinext`.

`wrangler.jsonc` tracks the Workers routes for `www.siso-sign.com` and
`siso-sign.com`, plus the D1, R2, Images, and KV bindings. The apex redirects
permanently to `www`, preserving the path and query string. Bundled static assets
are forwarded directly to the asset binding before the application handler.

See [CLOUDFLARE-MIGRATION.md](CLOUDFLARE-MIGRATION.md) for cutover verification.
