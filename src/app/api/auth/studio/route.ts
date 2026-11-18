import { NextRequest, NextResponse } from 'next/server';
import {
  createStudioToken,
  sessionCookieOptions,
  STUDIO_COOKIE,
} from '@/lib/auth';
import {
  authenticateStudio,
  createStudio,
  getStudioBySlug,
  toSafeStudio,
} from '@/lib/db';
import { assertSameOrigin, checkRateLimit, getClientIp } from '@/lib/security';
import type { IndustryType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { action } = body as { action?: 'login' | 'register' | 'logout' };

    if (action === 'logout') {
      const res = NextResponse.json({ ok: true });
      res.cookies.set(STUDIO_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
      return res;
    }

    const ip = getClientIp(req);
    const limit = checkRateLimit(`studio-auth:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: `Zbyt wiele prób logowania/rejestracji. Odczekaj ${limit.retryAfterSeconds} sek.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        }
      );
    }

    if (action === 'login') {
      const { email, password, demoSlug } = body as {
        email?: string;
        password?: string;
        demoSlug?: string;
      };

      if (demoSlug) {
        const demoStudio = getStudioBySlug(demoSlug);
        if (!demoStudio || !demoStudio.isDemo) {
          return NextResponse.json(
            { error: 'Wybrany profil nie jest kontem demonstracyjnym.' },
            { status: 403 }
          );
        }
        const token = createStudioToken(demoStudio.id);
        const res = NextResponse.json({ studio: toSafeStudio(demoStudio) });
        res.cookies.set(STUDIO_COOKIE, token, sessionCookieOptions());
        return res;
      }

      if (!email || !password) {
        return NextResponse.json(
          { error: 'Podaj adres e-mail oraz hasło.' },
          { status: 400 }
        );
      }

      const studio = authenticateStudio(email, password);
      if (!studio) {
        return NextResponse.json(
          { error: 'Nieprawidłowy e-mail (lub login) albo hasło.' },
          { status: 401 }
        );
      }

      const token = createStudioToken(studio.id);
      const res = NextResponse.json({ studio: toSafeStudio(studio) });
      res.cookies.set(STUDIO_COOKIE, token, sessionCookieOptions());
      return res;
    }

    if (action === 'register') {
      const { name, industry, city, instagram, phone, email, password } = body as {
        name?: string;
        industry?: IndustryType;
        city?: string;
        instagram?: string;
        phone?: string;
        email?: string;
        password?: string;
      };

      if (!name?.trim() || !email?.trim() || !password) {
        return NextResponse.json(
          { error: 'Podaj nazwę firmy, adres e-mail oraz hasło.' },
          { status: 400 }
        );
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Hasło musi mieć minimum 6 znaków.' },
          { status: 400 }
        );
      }

      const validIndustries: IndustryType[] = ['tattoo', 'detailing', 'groomer', 'other'];
      const safeIndustry: IndustryType =
        industry && validIndustries.includes(industry) ? industry : 'other';

      const studio = createStudio({
        name,
        industry: safeIndustry,
        city: city || 'Polska',
        instagram: instagram || '',
        phone: phone || '',
        ownerEmail: email,
        password,
        isDemo: false,
        plan: 'START',
      });

      const token = createStudioToken(studio.id);
      const res = NextResponse.json(
        { studio: toSafeStudio(studio) },
        { status: 201 }
      );
      res.cookies.set(STUDIO_COOKIE, token, sessionCookieOptions());
      return res;
    }

    return NextResponse.json({ error: 'Nieznana akcja autoryzacji.' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Błąd autoryzacji.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
