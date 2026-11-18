import { NextRequest, NextResponse } from 'next/server';
import {
  ADMIN_COOKIE,
  createAdminToken,
  sessionCookieOptions,
  verifyAdminPassword,
} from '@/lib/auth';
import { assertSameOrigin, checkRateLimit, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action, password } = body as {
      action?: 'login' | 'logout';
      password?: string;
    };

    if (action === 'logout') {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(ADMIN_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
      return res;
    }

    const ip = getClientIp(req);
    const limit = checkRateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Zbyt wiele prób logowania. Spróbuj ponownie za ${limit.retryAfterSeconds} sek.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        }
      );
    }

    if (!password || !verifyAdminPassword(password)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe hasło administratora.' },
        { status: 401 }
      );
    }

    const token = createAdminToken();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, token, sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: 'Błąd logowania.' }, { status: 400 });
  }
}
