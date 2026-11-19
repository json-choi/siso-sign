import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { safeAdminRedirect } from '@/lib/admin-redirect';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SUPABASE_JWT_SECRET || 'fallback-secret-key-change-in-production'
);

async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoginPage = pathname === '/admin' || pathname === '/admin/';

  if (isLoginPage) {
    // Someone already signed in skips the login form.
    const token = request.cookies.get('admin_session')?.value;
    if (token && (await verifyToken(token))) {
      const target = safeAdminRedirect(request.nextUrl.searchParams.get('redirect'));
      return NextResponse.redirect(new URL(target, request.url));
    }
  } else if (pathname.startsWith('/admin/')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token || !(await verifyToken(token))) {
      const loginUrl = new URL('/admin', request.url);
      loginUrl.searchParams.set('redirect', pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith('/api/admin') && !pathname.includes('/api/admin/auth')) {
    const token = request.cookies.get('admin_session')?.value;

    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
