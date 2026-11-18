import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { getAuthenticatedStudioId, verifyAdminSession } from '@/lib/auth';
import { getBookingByCode, getEffectiveStripeSecret, markBookingPaid, toPublicBooking } from '@/lib/db';
import { BlikCheckoutClient } from '@/components/BlikCheckoutClient';

export const dynamic = 'force-dynamic';

async function verifyStripeCheckoutSession(
  sessionId: string,
  expectedBookingId: string
): Promise<boolean> {
  const stripeSecret = getEffectiveStripeSecret();
  if (!stripeSecret || !sessionId) return false;
  try {
    const res = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: {
          Authorization: `Bearer ${stripeSecret}`,
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return false;
    const session = (await res.json()) as {
      payment_status?: string;
      metadata?: { bookingId?: string };
    };
    return (
      session.payment_status === 'paid' &&
      session.metadata?.bookingId === expectedBookingId
    );
  } catch {
    return false;
  }
}

export default async function BookingPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ paid?: string; session_id?: string }>;
}) {
  const { code } = await params;
  const sp = await searchParams;
  let found = getBookingByCode(code);

  if (
    found &&
    sp.paid === '1' &&
    sp.session_id &&
    found.booking.status === 'PENDING_PAYMENT'
  ) {
    const verified = await verifyStripeCheckoutSession(
      sp.session_id,
      found.booking.id
    );
    if (verified) {
      const updated = markBookingPaid(
        found.booking.id,
        'STRIPE_BLIK',
        sp.session_id
      );
      found = { booking: updated, studio: found.studio };
    }
  }

  if (!found) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white p-6 text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[5px] border border-[#90CAF9]/60 bg-[#E3F2FD] text-[#0D47A1]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-[#627D98]">404 / {code}</p>
            <h1 className="text-lg font-bold text-[#0A192F]">
              Nie znaleziono linku zadatku
            </h1>
            <p className="text-xs text-[#334E68] leading-relaxed">
              Link mógł wygasnąć lub kod rezerwacji jest nieprawidłowy. Wygeneruj nowy link w
              Panelu Salonu lub zobacz demo profilu.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-1">
            <Link
              href="/panel"
              className="rounded-[5px] bg-[#0D47A1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2196F3]"
            >
              Panel salonu
            </Link>
            <Link
              href="/s/ink-soul-tattoo"
              className="rounded-[5px] border border-[#90CAF9] bg-white px-4 py-2 text-xs font-medium text-[#0D47A1] hover:bg-[#E3F2FD]"
            >
              Profil demo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner =
    (await verifyAdminSession()) ||
    (await getAuthenticatedStudioId()) === found.booking.studioId;

  return (
    <BlikCheckoutClient
      initialBooking={isOwner ? found.booking : toPublicBooking(found.booking)}
      studio={found.studio}
    />
  );
}
