import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedStudioId, verifyAdminSession } from '@/lib/auth';
import {
  getDb,
  getEffectiveStripeSecret,
  getStudioById,
  subscribeStudioToPro,
  toSafeStudio,
} from '@/lib/db';
import { assertSameOrigin, checkRateLimit, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  const ip = getClientIp(req);
  const limit = checkRateLimit(`sub-pro:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Zbyt wiele prób płatności.' }, { status: 429 });
  }

  try {
    const isAdmin = await verifyAdminSession();
    const authStudioId = await getAuthenticatedStudioId();

    const body = await req.json();
    const { studioId, companyName, nip, blikCode, mode } = body as {
      studioId?: string;
      companyName?: string;
      nip?: string;
      blikCode?: string;
      mode?: 'stripe' | 'demo';
    };

    const targetStudioId = isAdmin && studioId ? studioId : authStudioId;
    if (!targetStudioId) {
      return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 });
    }
    if (!isAdmin && studioId && studioId !== authStudioId) {
      return NextResponse.json({ error: 'Brak uprawnień.' }, { status: 403 });
    }

    const studio = getStudioById(targetStudioId);
    if (!studio) {
      return NextResponse.json({ error: 'Nie znaleziono studia.' }, { status: 404 });
    }

    const db = getDb();
    const stripeSecret = getEffectiveStripeSecret(db);
    if (stripeSecret && mode !== 'demo') {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || req.nextUrl.origin;
      const priceGrosze = Math.round((db.config?.proPlanPricePln ?? 49) * 100);

      const params = new URLSearchParams();
      params.append('mode', 'payment');
      params.append('payment_method_types[0]', 'blik');
      params.append('payment_method_types[1]', 'card');
      params.append('line_items[0][price_data][currency]', 'pln');
      params.append(
        'line_items[0][price_data][product_data][name]',
        `Zadatkomat PRO (30 dni) — ${studio.name}`
      );
      params.append('line_items[0][price_data][unit_amount]', String(priceGrosze));
      params.append('line_items[0][quantity]', '1');
      params.append('success_url', `${appUrl}/panel?pro_paid=1`);
      params.append('cancel_url', `${appUrl}/panel`);
      params.append('metadata[studioId]', studio.id);

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
          { error: stripeData?.error?.message || 'Błąd Stripe Checkout.' },
          { status: 502 }
        );
      }

      return NextResponse.json({
        mode: 'STRIPE_CHECKOUT',
        checkoutUrl: stripeData.url,
      });
    }

    if (!studio.isDemo && !isAdmin) {
      return NextResponse.json(
        {
          error:
            'Aktywacja płatności PRO wymaga skonfigurowanej bramki Stripe przez administratora.',
        },
        { status: 400 }
      );
    }

    const result = subscribeStudioToPro(targetStudioId, {
      companyName: companyName || studio.name,
      nip,
      blikCode: blikCode || '',
    });

    return NextResponse.json({
      mode: 'BLIK_DIRECT',
      studio: toSafeStudio(result.studio),
      payment: result.payment,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Błąd opłacenia planu PRO.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
