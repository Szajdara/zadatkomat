import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStudioId, verifyAdminSession } from '@/lib/auth';
import { addWaitlistEntry, getDb, notifyWaitlist } from '@/lib/db';
import { assertSameOrigin, checkRateLimit, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(`waitlist:${ip}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Zbyt wiele prób.' }, { status: 429 });
  }

  try {
    const body = await req.json();

    if (body.action === 'notify') {
      const { studioId } = body as { studioId?: string };
      if (!studioId) {
        return NextResponse.json({ error: 'Brak studioId.' }, { status: 400 });
      }

      const isAdmin = await verifyAdminSession();
      const authStudioId = await getAuthenticatedStudioId();
      if (!isAdmin && authStudioId !== studioId) {
        return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 403 });
      }

      const notifiedEntries = notifyWaitlist(studioId);
      const db = getDb();
      return NextResponse.json({
        notifiedCount: notifiedEntries.length,
        notifiedEntries,
        waitlist: db.waitlist.filter((w) => w.studioId === studioId),
      });
    }

    const { studioId, clientName, clientPhone, preferredService, preferredDays } = body as {
      studioId?: string;
      clientName?: string;
      clientPhone?: string;
      preferredService?: string;
      preferredDays?: string;
    };

    if (!studioId || !clientName || !clientPhone) {
      return NextResponse.json(
        { error: 'Podaj imię oraz numer telefonu, aby zapisać się na listę rezerwową.' },
        { status: 400 }
      );
    }

    const entry = addWaitlistEntry({
      studioId,
      clientName,
      clientPhone,
      preferredService: preferredService || 'Dowolna usługa',
      preferredDays: preferredDays || 'Najbliższy wolny termin',
    });

    return NextResponse.json({ entry }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Błąd listy rezerwowej.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
