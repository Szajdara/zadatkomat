import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStudioId, verifyAdminSession } from '@/lib/auth';
import {
  BookingConflictError,
  createBooking,
  deleteBooking,
  getBookingByCode,
  getDb,
  requestBookingCancellation,
  toPublicBooking,
  updateBookingStatus,
} from '@/lib/db';
import { assertSameOrigin, checkRateLimit, getClientIp } from '@/lib/security';
import type { BookingStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const isAdmin = await verifyAdminSession();
  const authStudioId = await getAuthenticatedStudioId();

  if (code) {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`booking-lookup:${ip}`, 40, 10 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json({ error: 'Zbyt wiele zapytań.' }, { status: 429 });
    }

    const found = getBookingByCode(code);
    if (!found) {
      return NextResponse.json({ error: 'Nie znaleziono rezerwacji.' }, { status: 404 });
    }
    const isOwner = isAdmin || authStudioId === found.booking.studioId;
    return NextResponse.json({
      booking: isOwner ? found.booking : toPublicBooking(found.booking),
      studio: found.studio,
    });
  }

  if (!isAdmin && !authStudioId) {
    return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 });
  }

  const db = getDb();
  const bookings = isAdmin
    ? db.bookings
    : db.bookings.filter((b) => b.studioId === authStudioId);

  return NextResponse.json({ bookings });
}

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(`bookings-create:${ip}`, 25, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Zbyt wiele rezerwacji z tego adresu. Odczekaj ${limit.retryAfterSeconds} sek.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      studioId,
      serviceId,
      serviceName,
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      customFieldLabel,
      customFieldValue,
      date,
      time,
      totalPrice,
      depositAmount,
      source,
    } = body;

    if (!studioId || !serviceName || !clientName || !clientPhone || !date || !time) {
      return NextResponse.json(
        { error: 'Wypełnij wymagane pola: studio, usługa, imię, telefon, data i godzina.' },
        { status: 400 }
      );
    }

    const safeSource = source === 'IG_LINK' ? 'IG_LINK' : 'PUBLIC_PROFILE';
    if (safeSource === 'IG_LINK') {
      const isAdmin = await verifyAdminSession();
      const authStudioId = await getAuthenticatedStudioId();
      if (!isAdmin && authStudioId !== studioId) {
        return NextResponse.json(
          { error: 'Zaloguj się jako właściciel tego salonu, aby generować linki wyceny.' },
          { status: 401 }
        );
      }
    }

    const parsedDeposit = Number(depositAmount);
    const parsedTotal = Number(totalPrice || depositAmount);

    if (safeSource === 'IG_LINK' && (!Number.isFinite(parsedDeposit) || parsedDeposit < 10)) {
      return NextResponse.json(
        { error: 'Minimalna kwota zadatku to 10 zł.' },
        { status: 400 }
      );
    }

    const booking = createBooking({
      studioId,
      serviceId,
      serviceName,
      clientName,
      clientPhone,
      clientEmail,
      clientNotes,
      customFieldLabel,
      customFieldValue,
      date,
      time,
      totalPrice: parsedTotal,
      depositAmount: parsedDeposit,
      source: safeSource,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : 'Błąd podczas tworzenia rezerwacji.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(`bookings-patch:${ip}`, 30, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Zbyt wiele operacji.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      bookingId,
      shortCode,
      status,
      clientAction,
      reason,
    } = body as {
      bookingId?: string;
      shortCode?: string;
      status?: BookingStatus;
      clientAction?: 'cancel';
      reason?: string;
    };

    if (clientAction === 'cancel') {
      if (!bookingId || !shortCode) {
        return NextResponse.json(
          { error: 'Wymagany kod rezerwacji do zgłoszenia zmiany.' },
          { status: 400 }
        );
      }
      const found = getBookingByCode(bookingId);
      if (!found || found.booking.shortCode.toUpperCase() !== shortCode.trim().toUpperCase()) {
        return NextResponse.json(
          { error: 'Nieprawidłowy kod rezerwacji.' },
          { status: 403 }
        );
      }
      const result = requestBookingCancellation(found.booking.id, reason || '');
      return NextResponse.json({
        ...result,
        ...(result.booking ? { booking: toPublicBooking(result.booking) } : {}),
      });
    }

    const isAdmin = await verifyAdminSession();
    const authStudioId = await getAuthenticatedStudioId();

    if (!isAdmin && !authStudioId) {
      return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 });
    }

    const allowed: BookingStatus[] = [
      'PENDING_PAYMENT',
      'PAID',
      'CANCELLED_FORFEITED',
      'COMPLETED',
    ];

    if (!bookingId || !status || !allowed.includes(status)) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane aktualizacji statusu.' },
        { status: 400 }
      );
    }

    const found = getBookingByCode(bookingId);
    if (!found) {
      return NextResponse.json({ error: 'Nie znaleziono rezerwacji.' }, { status: 404 });
    }

    if (!isAdmin && found.booking.studioId !== authStudioId) {
      return NextResponse.json(
        { error: 'Brak uprawnień do rezerwacji innego salonu.' },
        { status: 403 }
      );
    }

    const booking = updateBookingStatus(bookingId, status);
    return NextResponse.json({ booking });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Nie udało się zmienić statusu.';
    return NextResponse.json({ error: message }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  const isAdmin = await verifyAdminSession();
  const authStudioId = await getAuthenticatedStudioId();

  if (!isAdmin && !authStudioId) {
    return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Brak parametru id.' }, { status: 400 });
  }

  const found = getBookingByCode(id);
  if (!found) {
    return NextResponse.json({ error: 'Nie znaleziono rezerwacji.' }, { status: 404 });
  }

  if (!isAdmin && found.booking.studioId !== authStudioId) {
    return NextResponse.json({ error: 'Brak uprawnień.' }, { status: 403 });
  }

  const deleted = deleteBooking(found.booking.id);
  return NextResponse.json({ deleted });
}
