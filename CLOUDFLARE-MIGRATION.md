# Cloudflare migration

Target: Workers + D1 + R2. The application no longer calls Supabase. The existing JWT signing/salt value remains under its original environment variable name so existing sessions and password hashes retain compatibility.

A separate D1 replica contains all 32 application rows in five tables. Supabase Auth had no users. All 74 source storage objects (220,228,167 bytes) were backed up, copied to the dedicated R2 bucket, downloaded again, and SHA-256 verified. Fifteen image URL fields were rewritten in the replica to `/media/` routes. Source database timestamps and IDs were preserved. Original Supabase data remains unchanged.

Validation: PostgreSQL dump restored and every application field compared; local SQLite and remote D1 full-row/foreign-key validation; TypeScript and Workers build; D1 integration checks for CRUD, visibility, private tables, identifier validation, arrays/booleans and atomic bulk rollback. Remote preview passed password login, 20 settings reads, service create/update/delete and exact image upload/download. Test objects and rows were removed.

`pnpm build` builds Workers. `pnpm test:d1` uses an isolated local D1. Runtime bindings are `DB` and `MEDIA`; the application data client applies public visibility filters and admin routes require authentication. Image uploads use the authenticated application endpoint, with compressed images limited to 10 MB.

Production cutover has NOT happened. Before cutover: pause source writes, create a fresh consistent source snapshot and final D1/R2 copy, compare all fields and objects, bind the final database, validate authentication and DNS/TLS, then switch the production hostname. Keep Vercel and Supabase for rollback. Reverting DNS alone will not copy later D1 writes back to PostgreSQL; the reverse synchronization and upload-capable fallback must be tested before production.

The manual GitHub deployment workflow needs a personal-account API token. Do not merge to main while Vercel automatic deployment still targets this branch's Cloudflare-only runtime.
