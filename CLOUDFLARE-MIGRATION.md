# Cloudflare migration

Production DNS was switched to Cloudflare on 2026-09-09. Both `siso-sign.com`
and `www.siso-sign.com` route to the `siso-sign` Worker. The apex permanently
redirects to HTTPS `www`, preserving paths and query strings.

The application runs on Workers with D1, R2, KV, and Images. It no longer calls
Supabase. `SUPABASE_JWT_SECRET` retains its original name and value to preserve
existing admin sessions and password hashes; `ADMIN_PASSWORD` also remains a
Worker secret.

At cutover, all 32 application rows in five tables matched the source field by
field after rewriting image URLs to `/media/`. All 74 source images
(220,228,167 bytes) matched their retained backups by object metadata. Every R2
object was downloaded and its SHA-256 matched the source backup. The Vercel
admin API was frozen before the final comparison to prevent application writes
during cutover. Source snapshots and original DNS settings are backed up
privately outside the repository.

The previous Workers deployment returned 404 for bundled CSS and JavaScript
because `run_worker_first` bypassed automatic asset serving. `worker.js` now
forwards `/_next/static/` to `ASSETS` before the application handler. Three
regression tests cover asset routing, protected application routes, and the apex
redirect. TypeScript, isolated D1 integration tests, and the Workers build pass.

Pushing `main` runs `.github/workflows/cloudflare.yml` and deploys to Cloudflare
using the existing `cloudflare-production` environment. Vercel's Git integration
has been disconnected so Cloudflare-only code is not deployed there.

Vercel remains a temporary fallback for resolvers that still cache the old DNS.
Its admin API stays blocked to avoid writes to the old database. Remove the old
Vercel project only after cached Vercel DNS responses have expired. Original
Supabase data and storage remain preserved as migration backups; they are not
used by the Cloudflare application. Switching DNS back alone would not copy
subsequent D1 or R2 writes back to Supabase.
