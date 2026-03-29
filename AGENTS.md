# AGENTS.md - Coding Agent Guidelines for siso-sign

## Project Overview

siso-sign is a brand homepage for a signage design agency built with Next.js 16, React 19, and Supabase.

**Tech Stack:**
- Framework: Next.js 16.1 (App Router, Turbopack)
- UI: React 19, Tailwind CSS 4, Framer Motion
- Backend: Supabase (PostgreSQL, Auth, Storage)
- Language: TypeScript 5 (strict mode)
- Icons: Lucide React
- Package Manager: pnpm

---

## Workflow

This workflow is designed to allow anyone, regardless of Git expertise, to contribute safely.

### 1. Before Starting Work: Stay Updated
Always pull the latest changes from the `main` branch to ensure your local version is up-to-date. This prevents merge conflicts.
```bash
git pull origin main
```

### 2. After Completing Work: Verify and Push
Follow these steps to ensure your changes are safe and deployed correctly.

**A. Check for Errors**
Before committing, run the build command to check for type errors and other issues.
```bash
pnpm build
```
*(If you changed dependencies, run `pnpm install` before building.)*

**B. Push to Main**
Once verified, commit and push your changes to the `main` branch.
```bash
# Add all changed files
git add .
# Commit with a clear message
git commit -m "Your descriptive commit message"
# Push to the remote repository
git push origin main
```

### 3. Automatic Deployment
Pushing to the `main` branch automatically deploys the project to Vercel.
- **Live Domain:** [www.siso-sign.com](https://www.siso-sign.com)

---

## Build / Lint / Test Commands

**No test framework configured yet.** If tests are added, use Vitest or Jest.

---

## Project Structure

---

## Code Style Guidelines

### Imports

Order imports in this sequence:
1. React/Next.js core (`'use client'` directive first if needed)
2. External libraries (framer-motion, lucide-react, etc.)
3. Internal modules with `@/` alias
4. Types (use `import type` for type-only imports)

### TypeScript

- **Strict mode enabled** - no implicit any
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer explicit return types on exported functions
- Use `| null` over `| undefined` for optional values from DB
- Never use `as any`, `@ts-ignore`, or `@ts-expect-error`

### React Components

- Use function declarations for components (`export default function`)
- Client components: Add `'use client'` directive at top
- Server components: Default (no directive needed)
- Props destructuring in function signature

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `AdminSidebar.tsx` |
| Pages | `page.tsx` in folder | `app/admin/page.tsx` |
| API Routes | `route.ts` | `app/api/admin/auth/route.ts` |
| Utilities | camelCase | `supabase.ts`, `auth.ts` |
| Types | PascalCase | `Portfolio`, `SiteSetting` |
| DB columns | snake_case | `is_published`, `created_at` |
| CSS variables | kebab-case | `--font-cal-sans` |

### Styling

- Use Tailwind CSS classes exclusively
- Custom colors defined in `globals.css` under `:root`
- Use CSS variables for theming: `bg-background`, `text-primary`
- Utility pattern: `clsx()` + `tailwind-merge` for conditional classes

### Error Handling

- API routes: Return `NextResponse.json({ error: message }, { status: code })`
- Client: Use try/catch with user-friendly error messages
- Never swallow errors silently

---

## API Route Patterns

Next.js 16 uses Promise-based params:

Standard CRUD pattern:
- `GET /api/admin/[resource]` - List all
- `POST /api/admin/[resource]` - Create
- `GET /api/admin/[resource]/[id]` - Get one
- `PUT /api/admin/[resource]/[id]` - Update
- `DELETE /api/admin/[resource]/[id]` - Delete

---

## Authentication

- Admin auth uses JWT tokens stored in httpOnly cookies
- Middleware protects `/admin/*` routes (except `/admin` login page)
- API routes under `/api/admin/*` require valid session
- Single admin password stored in `ADMIN_PASSWORD` env var

---

## Environment Variables

Required in `.env.local`:

---

## Common Pitfalls to Avoid

1. **useSearchParams without Suspense** - Wrap in `<Suspense>` boundary
2. **Missing 'use client'** - Required for hooks, event handlers, browser APIs
3. **Direct DB access in client** - Always go through API routes
4. **Hardcoded strings** - Use site_settings table for editable content
5. **Forgetting await on params** - Next.js 16 params are Promises

---

## File Templates
