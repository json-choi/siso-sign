import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { createAdminClient } from '@/lib/supabase';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SUPABASE_JWT_SECRET || 'fallback-secret-key-change-in-production'
);

const COOKIE_NAME = 'admin_session';
const EXPIRATION_TIME = '7d';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + process.env.SUPABASE_JWT_SECRET);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPasswordHash(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRATION_TIME)
    .sign(SECRET_KEY);

  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET_KEY);
    return true;
  } catch {
    return false;
  }
}

export async function getSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getSession();
  if (!token) return false;
  return verifySession(token);
}

export async function validatePassword(password: string): Promise<boolean> {
  const supabase = createAdminClient();
  
  const { data: dbPassword } = await supabase
    .from('admin_password')
    .select('password_hash')
    .single();

  if (dbPassword?.password_hash) {
    return verifyPasswordHash(password, dbPassword.password_hash);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD is not set');
    return false;
  }
  return password === adminPassword;
}
