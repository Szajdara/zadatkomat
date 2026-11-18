import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStudioId, verifyAdminSession } from '@/lib/auth';
import {
  computePlatformStats,
  createStudio,
  getDb,
  toSafeStudio,
  updateStudioPlan,
  updateStudioSettings,
} from '@/lib/db';
import { assertSameOrigin, checkRateLimit, getClientIp } from '@/lib/security';
import type { IndustryType, ServiceItem, StudioPlan } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(`studios-post:${ip}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Zbyt wiele żądań.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const isAdmin = await verifyAdminSession();
    const authStudioId = await getAuthenticatedStudioId();

    if (body.action === 'update_plan') {
      const { studioId, plan } = body as { studioId?: string; plan?: StudioPlan };
      if (!studioId || (plan !== 'START' && plan !== 'PRO')) {
        return NextResponse.json(
          { error: 'Nieprawidłowy identyfikator studia lub plan.' },
          { status: 400 }
        );
      }
      if (!isAdmin && authStudioId !== studioId) {
        return NextResponse.json({ error: 'Brak autoryzacji do zmiany planu.' }, { status: 403 });
      }
      if (plan === 'PRO' && !isAdmin) {
        return NextResponse.json(
          { error: 'Przejście na Plan PRO wymaga opłacenia subskrypcji.' },
          { status: 402 }
        );
      }
      const studio = updateStudioPlan(studioId, plan);
      const db = getDb();
      return NextResponse.json({
        studio: toSafeStudio(studio),
        ...(isAdmin ? { stats: computePlatformStats(db) } : {}),
      });
    }

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Aby założyć konto salonu, skorzystaj z formularza rejestracji.' },
        { status: 401 }
      );
    }

    const { name, industry, city, instagram, phone, plan, cancelPolicyHours, bio } = body as {
      name?: string;
      industry?: IndustryType;
      city?: string;
      instagram?: string;
      phone?: string;
      plan?: StudioPlan;
      cancelPolicyHours?: number;
      bio?: string;
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Podaj nazwę studia lub firmy.' }, { status: 400 });
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
      isDemo: true,
      plan: plan === 'PRO' ? 'PRO' : 'START',
      cancelPolicyHours: cancelPolicyHours ?? 48,
      bio,
    });

    const db = getDb();
    return NextResponse.json(
      {
        studio: toSafeStudio(studio),
        stats: computePlatformStats(db),
      },
      { status: 201 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Błąd zapisu studia.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  try {
    const isAdmin = await verifyAdminSession();
    const authStudioId = await getAuthenticatedStudioId();

    const body = await req.json();
    const {
      studioId,
      name,
      city,
      instagram,
      phone,
      blikPhone,
      bankAccount,
      nip,
      bio,
      cancelPolicyHours,
      services,
    } = body as {
      studioId?: string;
      name?: string;
      city?: string;
      instagram?: string;
      phone?: string;
      blikPhone?: string;
      bankAccount?: string;
      nip?: string;
      bio?: string;
      cancelPolicyHours?: number;
      services?: ServiceItem[];
    };

    const targetStudioId = isAdmin && studioId ? studioId : authStudioId;
    if (!targetStudioId) {
      return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 });
    }

    if (!isAdmin && studioId && studioId !== authStudioId) {
      return NextResponse.json(
        { error: 'Brak uprawnień do edycji innego salonu.' },
        { status: 403 }
      );
    }

    const updated = updateStudioSettings(targetStudioId, {
      name,
      city,
      instagram,
      phone,
      blikPhone,
      bankAccount,
      nip,
      bio,
      cancelPolicyHours,
      services,
    });

    return NextResponse.json({ studio: toSafeStudio(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Błąd aktualizacji ustawień salonu.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
