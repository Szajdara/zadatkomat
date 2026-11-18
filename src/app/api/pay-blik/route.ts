import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStudioId, verifyAdminSession } from '@/lib/auth';
import {
  computePlatformStats,
  declarePhoneTransfer,
  getBookingByCode,
  getDb,
  getEffectiveStripeSecret,
  markBookingPaid,
  toPublicBooking,
} from '@/lib/db';
import { sendBookingConfirmationEmail, sendBookingSms } from '@/lib/notifications';
import { assertSameOrigin, checkRateLimit, getClientIp } from '@/lib/security';
import type { PaymentMethodType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(`pay-blik:${ip}`, 15, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Zbyt wiele prób płatności. Odczekaj ${limit.retryAfterSeconds} sek.` },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const {
      bookingId,
      blikCode,
      acceptTerms,
      clientEmail,
      paymentMethod = 'BLIK_CODE',
      mode,
    } = body as {
      bookingId?: string;
      blikCode?: string;
      acceptTerms?: boolean;
      clientEmail?: string;
      paymentMethod?: PaymentMethodType;
      mode?: 'stripe' | 'demo';
    };

    if (!bookingId) {
      return NextResponse.json({ error: 'Brak identyfikatora rezerwacji.' }, { status: 400 });
    }

    if (!acceptTerms) {
      return NextResponse.json(
        { error: 'Musisz zaakceptować regulamin zadatku (art. 394 Kodeksu cywilnego).' },
        { status: 400 }
      );
    }

    const found = getBookingByCode(bookingId);
    if (!found) {
      return NextResponse.json({ error: 'Nie znaleziono rezerwacji.' }, { status: 404 });
    }

    const { booking, studio } = found;
    const isAdmin = await verifyAdminSession();
    const authStudioId = await getAuthenticatedStudioId();
    const isOwner = isAdmin || authStudioId === booking.studioId;
    const db = getDb();

    if (booking.status === 'PAID' || booking.status === 'COMPLETED') {
      return NextResponse.json({
        mode: booking.paymentProvider ?? 'DEMO_BLIK',
        booking: isOwner ? booking : toPublicBooking(booking),
        ...(isAdmin ? { stats: computePlatformStats(db) } : {}),
      });
    }

    const isDemoStudio = Boolean(studio?.isDemo);

    if (paymentMethod === 'BLIK_PHONE_TRANSFER') {
      if (isDemoStudio) {
        const paidBooking = markBookingPaid(booking.id, 'PHONE_BLIK', undefined, {
          clientEmail,
          paymentMethod: 'BLIK_PHONE_TRANSFER',
        });
        return NextResponse.json({
          mode: 'PHONE_BLIK_DEMO',
          booking: isOwner ? paidBooking : toPublicBooking(paidBooking),
          message: `Tryb demo: zatwierdzono przelew na telefon BLIK (${paidBooking.depositAmount} zł).`,
        });
      }

      const declared = declarePhoneTransfer(booking.id, clientEmail);
      return NextResponse.json({
        mode: 'PHONE_BLIK_PENDING_CONFIRMATION',
        booking: isOwner ? declared : toPublicBooking(declared),
        message:
          'Zgłoszono przelew na telefon BLIK. Właściciel salonu potwierdzi zaksięgowanie wpłaty w panelu.',
      });
    }

    const stripeSecret = getEffectiveStripeSecret(db);
    if (stripeSecret && mode !== 'demo') {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || req.nextUrl.origin;
      const totalGrosze = Math.round((booking.depositAmount + booking.serviceFee) * 100);
      const applicationFeeGrosze = Math.round(booking.serviceFee * 100);

      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append('payment_method_types[0]', 'blik');
      params.append('payment_method_types[1]', 'card');
      params.append('line_items[0][price_data][currency]', 'pln');
      params.append(
        'line_items[0][price_data][product_data][name]',
        `Zadatek: ${booking.serviceName} (${booking.studioName})`
      );
      params.append(
        'line_items[0][price_data][product_data][description]',
        `Termin: ${booking.date} ${booking.time}. Zawiera opłatę serwisową ${booking.serviceFee.toFixed(2)} zł.`
      );
      params.append('line_items[0][price_data][unit_amount]', String(totalGrosze));
      params.append('line_items[0][quantity]', '1');
      if (clientEmail?.trim()) {
        params.append('customer_email', clientEmail.trim());
      }
      params.append(
        'success_url',
        `${appUrl}/z/${booking.shortCode}?paid=1&session_id={CHECKOUT_SESSION_ID}`
      );
      params.append('cancel_url', `${appUrl}/z/${booking.shortCode}?cancelled=1`);
      params.append('metadata[bookingId]', booking.id);
      params.append('metadata[shortCode]', booking.shortCode);
      params.append('metadata[applicationFeeGrosze]', String(applicationFeeGrosze));

      const connectedAccountId = process.env.STRIPE_CONNECTED_ACCOUNT_ID?.trim();
      if (connectedAccountId && applicationFeeGrosze > 0) {
        params.append('payment_intent_data[application_fee_amount]', String(applicationFeeGrosze));
        params.append('payment_intent_data[transfer_data][destination]', connectedAccountId);
      }

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecret}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const stripeData = await stripeRes.json();
      if (!stripeRes.ok) {
        return NextResponse.json(
          { error: stripeData?.error?.message || 'Błąd połączenia ze Stripe BLIK.' },
          { status: 502 }
        );
      }

      return NextResponse.json({
        mode: 'STRIPE_CHECKOUT',
        checkoutUrl: stripeData.url,
        sessionId: stripeData.id,
        applicationFeeGrosze,
      });
    }

    if (!isDemoStudio) {
      return NextResponse.json(
        {
          error:
            'Bramka płatności online BLIK (Stripe) nie jest jeszcze skonfigurowana dla tego salonu. Wybierz „Przelew na telefon BLIK”.',
        },
        { status: 400 }
      );
    }

    const cleanedCode = (blikCode ?? '').replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleanedCode)) {
      return NextResponse.json(
        { error: 'Wpisz poprawny 6-cyfrowy kod BLIK z aplikacji bankowej.' },
        { status: 400 }
      );
    }

    const paidBooking = markBookingPaid(booking.id, 'DEMO_BLIK', undefined, {
      clientEmail,
      paymentMethod: 'BLIK_CODE',
    });

    const emailStatus = await sendBookingConfirmationEmail({
      to: paidBooking.clientEmail,
      booking: paidBooking,
      studio,
      apiKey: db.config?.resendApiKey,
    });
    const smsStatus = await sendBookingSms({
      phone: paidBooking.clientPhone,
      message: `Zadatkomat: potwierdzamy wpłatę zadatku (${paidBooking.depositAmount} zł) w ${paidBooking.studioName}. Termin: ${paidBooking.date} ${paidBooking.time}. Kod: ${paidBooking.shortCode}.`,
      token: db.config?.smsApiToken,
    });

    const freshDb = getDb();
    return NextResponse.json({
      mode: 'DEMO_BLIK',
      booking: isOwner ? paidBooking : toPublicBooking(paidBooking),
      notifications: { email: emailStatus.sent, sms: smsStatus.sent },
      ...(isAdmin ? { stats: computePlatformStats(freshDb) } : {}),
      message: `Płatność BLIK potwierdzona. Zaksięgowano ${paidBooking.depositAmount} zł zadatku.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Błąd przetwarzania płatności BLIK.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
