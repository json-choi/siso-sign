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

## Build / Lint / Test Commands

```bash
# Development
pnpm dev              # Start dev server with Turbopack

# Build & Production
pnpm build            # Production build (includes type checking)
pnpm start            # Start production server

# Linting
pnpm lint             # Run ESLint

# Type Checking (standalone)
pnpm tsc --noEmit     # Check types without emitting
```

**No test framework configured yet.** If tests are added, use Vitest or Jest.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin panel (protected routes)
│   │   ├── (dashboard)/    # Route group with shared layout
│   │   │   ├── dashboard/
│   │   │   ├── portfolios/
│   │   │   ├── services/
│   │   │   ├── settings/
│   │   │   └── links/
│   │   └── page.tsx        # Login page
│   ├── api/admin/          # API routes (protected by middleware)
│   ├── work/               # Portfolio pages
│   └── page.tsx            # Homepage
├── components/
│   ├── admin/              # Admin-specific components
│   └── layout/             # Shared layout components
├── lib/                    # Utilities (supabase, auth)
└── types/                  # TypeScript type definitions
```

---

## Code Style Guidelines

### Imports

Order imports in this sequence:
1. React/Next.js core (`'use client'` directive first if needed)
2. External libraries (framer-motion, lucide-react, etc.)
3. Internal modules with `@/` alias
4. Types (use `import type` for type-only imports)

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Portfolio } from '@/types/database';
```

### TypeScript

- **Strict mode enabled** - no implicit any
- Use `interface` for object shapes, `type` for unions/intersections
- Prefer explicit return types on exported functions
- Use `| null` over `| undefined` for optional values from DB
- Never use `as any`, `@ts-ignore`, or `@ts-expect-error`

```typescript
// Database types pattern
export interface Portfolio {
  id: string;
  title: string;
  description: string | null;  // nullable DB fields
  is_published: boolean;
}

// Derived types
export type PortfolioInsert = Omit<Portfolio, 'id' | 'created_at' | 'updated_at'>;
export type PortfolioUpdate = Partial<PortfolioInsert>;
```

### React Components

- Use function declarations for components (`export default function`)
- Client components: Add `'use client'` directive at top
- Server components: Default (no directive needed)
- Props destructuring in function signature

```typescript
// Client component
'use client';

export default function AdminSidebar() {
  const [state, setState] = useState(false);
  // ...
}

// Server component (default)
export default async function DashboardPage() {
  const data = await fetchData();
  // ...
}
```

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

```typescript
import { clsx } from 'clsx';

className={clsx(
  'px-4 py-2 rounded-lg transition-colors',
  isActive ? 'bg-primary text-black' : 'text-gray-400 hover:bg-white/5'
)}
```

### Error Handling

- API routes: Return `NextResponse.json({ error: message }, { status: code })`
- Client: Use try/catch with user-friendly error messages
- Never swallow errors silently

```typescript
// API Route
if (error) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}

// Client
try {
  const res = await fetch('/api/...');
  if (!res.ok) {
    const data = await res.json();
    setError(data.error || 'Something went wrong');
    return;
  }
} catch {
  setError('Server error occurred');
}
```

---

## API Route Patterns

Next.js 16 uses Promise-based params:

```typescript
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  // ...
}
```

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
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
ADMIN_PASSWORD=
```

---

## Common Pitfalls to Avoid

1. **useSearchParams without Suspense** - Wrap in `<Suspense>` boundary
2. **Missing 'use client'** - Required for hooks, event handlers, browser APIs
3. **Direct DB access in client** - Always go through API routes
4. **Hardcoded strings** - Use site_settings table for editable content
5. **Forgetting await on params** - Next.js 16 params are Promises

---

## File Templates

### New API Route
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from('table').select('*');
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
```

### New Admin Page
```typescript
'use client';

import { useState, useEffect } from 'react';

export default function NewPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/resource')
      .then(res => res.json())
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="text-white">로딩 중...</div>;

  return <div>{/* content */}</div>;
}
```
