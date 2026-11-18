import crypto from 'node:crypto';
import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'zadatkomat_admin_session';
export const STUDIO_COOKIE = 'zadatkomat_studio_session';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.ADMIN_PASSWORD?.trim() ||
    'zadatkomat-local-signing-secret-2026'
  );
}

export function getExpectedAdminPassword(): string {
  return process.env.ADMIN_PASSWORD?.trim() || 'admin2026';
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  try {
    const keyBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = crypto.scryptSync(password, salt, 64);
    if (keyBuf.length !== derivedBuf.length) return false;
    return crypto.timingSafeEqual(keyBuf, derivedBuf);
  } catch {
    return false;
  }
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getExpectedAdminPassword();
  const a = Buffer.from(password, 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

interface TokenPayload {
  role: 'admin' | 'studio';
  studioId?: string;
  exp: number;
}

function signToken(payload: TokenPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getAuthSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token?: string): TokenPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  try {
    const expectedSig = crypto
      .createHmac('sha256', getAuthSecret())
      .update(encoded)
      .digest('base64url');
    const a = Buffer.from(sig, 'utf-8');
    const b = Buffer.from(expectedSig, 'utf-8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf-8')
    ) as TokenPayload;

    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function createAdminToken(): string {
  return signToken({
    role: 'admin',
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  });
}

export function createStudioToken(studioId: string): string {
  return signToken({
    role: 'studio',
    studioId,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  });
}

export async function verifyAdminSession(): Promise<boolean> {
  const store = await cookies();
  const raw = store.get(ADMIN_COOKIE)?.value;
  const payload = verifyToken(raw);
  return payload?.role === 'admin';
}

export async function getAuthenticatedStudioId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(STUDIO_COOKIE)?.value;
  const payload = verifyToken(raw);
  if (payload?.role === 'studio' && payload.studioId) {
    return payload.studioId;
  }
  return null;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_SECONDS,
  };
}
