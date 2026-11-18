'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarPlus, Check, Copy, Lock, Printer } from 'lucide-react';
import type { Booking, PaymentMethodType, Studio } from '@/lib/types';
import { formatPLN } from '@/lib/industry';
import { sanitizeIcsField } from '@/lib/security';

interface BlikCheckoutClientProps {
  initialBooking: Booking;
  studio?: Studio;
}

export function BlikCheckoutClient({
  initialBooking,
  studio,
}: BlikCheckoutClientProps) {
  const [booking, setBooking] = useState<Booking | null>(initialBooking);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('BLIK_CODE');
  const [blikCode, setBlikCode] = useState('');
  const [clientEmail, setClientEmail] = useState(initialBooking.clientEmail ?? '');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [phase, setPhase] = useState<'IDLE' | 'WAITING_BANK' | 'ERROR'>('IDLE');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Cancellation / Reschedule state
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelledUnpaid, setCancelledUnpaid] = useState(false);

  const [secondsLeft, setSecondsLeft] = useState<number>(900);

  useEffect(() => {
    if (!booking) return;
    const diff = Math.floor(
      (new Date(booking.expiresAt).getTime() - Date.now()) / 1000
    );
    setSecondsLeft(diff > 30 ? Math.min(diff, 900) : 900);
  }, [booking?.expiresAt]);

  useEffect(() => {
    if (!booking || booking.status !== 'PENDING_PAYMENT') return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [booking?.status]);

  if (cancelledUnpaid || !booking) {
    return (
      <div className="snipper-soft-tint w-full min-h-[calc(100vh-140px)] py-12 px-4">
        <div className="mx-auto max-w-md rounded-[10px] border border-[#90CAF9]/50 bg-white p-6 text-center space-y-4">
          <h1 className="text-lg font-bold text-[#0A192F]">Rezerwacja została anulowana</h1>
          <p className="text-xs text-[#334E68]">
            Nieopłacony termin został zwolniony i wrócił do kalendarza studia.
          </p>
          <Link
            href={`/s/${initialBooking.studioSlug}`}
            className="product-link !w-full"
          >
            Wybierz nowy termin
          </Link>
        </div>
      </div>
    );
  }

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const secs = String(secondsLeft % 60).padStart(2, '0');

  const totalToPayNow = Number((booking.depositAmount + booking.serviceFee).toFixed(2));
  const remainingOnSite = Math.max(0, booking.totalPrice - booking.depositAmount);
  const cancelHours = studio?.cancelPolicyHours ?? 48;
  const studioBlikPhone = studio?.blikPhone || studio?.phone || '+48 500 000 000';
  const transferTitle = `Zadatek ${booking.shortCode}`;

  const copyText = (text: string, key: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey((p) => (p === key ? null : p)), 2000);
  };

  const handlePayBlik = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!acceptTerms) {
      setErrorMsg('Zaznacz zgodę na regulamin zadatku (art. 394 Kodeksu cywilnego).');
      return;
    }

    if (paymentMethod === 'BLIK_CODE') {
      const cleanDigits = blikCode.replace(/\D/g, '');
      if (cleanDigits.length !== 6) {
        setErrorMsg('Kod BLIK musi składać się z dokładnie 6 cyfr.');
        return;
      }
    }

    setPhase('WAITING_BANK');

    try {
      await new Promise((r) => setTimeout(r, 800));

      const res = await fetch('/api/pay-blik', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          blikCode: blikCode.replace(/\D/g, ''),
          acceptTerms,
          clientEmail,
          paymentMethod,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPhase('ERROR');
        setErrorMsg(data.error || 'Płatność nie powiodła się.');
        return;
      }

      if (data.mode === 'STRIPE_CHECKOUT' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setBooking(data.booking);
      setPhase('IDLE');
    } catch {
      setPhase('ERROR');
      setErrorMsg('Błąd połączenia z serwerem płatności.');
    }
  };

  const handleClientCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancelling(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          shortCode: booking.shortCode,
          clientAction: 'cancel',
          reason: cancelReason,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.action === 'DELETED_UNPAID') {
          setCancelledUnpaid(true);
        } else if (data.booking) {
          setBooking(data.booking);
          setShowCancelForm(false);
        }
      }
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadIcs = () => {
    const startCompact =
      booking.date.replace(/-/g, '') + 'T' + booking.time.replace(':', '') + '00';
    const [hStr, mStr] = booking.time.split(':');
    const endHour = String(Math.min(23, Number(hStr) + 2)).padStart(2, '0');
    const endCompact = booking.date.replace(/-/g, '') + 'T' + endHour + mStr + '00';

    const safeSummary = sanitizeIcsField(`${booking.serviceName} — ${booking.studioName}`);
    const safeDesc = sanitizeIcsField(
      `Zadatek BLIK opłacony (${booking.depositAmount} zł). Kod: ${booking.shortCode}. ${booking.customFieldValue}`
    );
    const safeLocation = sanitizeIcsField(`${studio?.city ?? 'Polska'} (${booking.studioName})`);

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Zadatkomat.pl//PL',
      'BEGIN:VEVENT',
      `UID:${booking.id}@zadatkomat.pl`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${startCompact}`,
      `DTEND:${endCompact}`,
      `SUMMARY:${safeSummary}`,
      `DESCRIPTION:${safeDesc}`,
      `LOCATION:${safeLocation}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wizyta-${booking.shortCode}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="snipper-soft-tint w-full min-h-[calc(100vh-140px)] py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-md rounded-[10px] border border-[#90CAF9]/50 bg-white overflow-hidden shadow-xl shadow-[#0D47A1]/5">
        <div className="flex items-center justify-between border-b border-[#90CAF9]/35 bg-[#E3F2FD]/60 px-5 py-3.5">
          <div className="flex items-center gap-2 text-xs text-[#334E68]">
            <span className="font-semibold text-[#0D47A1]">
              Rezerwacja {booking.shortCode}
            </span>
            {studio?.city && <span className="text-[#627D98]">• {studio.city}</span>}
          </div>

          {booking.status === 'PENDING_PAYMENT' ? (
            <span className="rounded-[5px] bg-[#0D47A1] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-white">
              {mins}:{secs}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0A192F]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  booking.status === 'CANCELLED_FORFEITED'
                    ? 'bg-red-600'
                    : 'bg-[#2196F3]'
                }`}
              />
              {booking.status === 'CANCELLED_FORFEITED' ? 'Zatrzymano' : 'Opłacono'}
            </span>
          )}
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-[11px] font-medium text-[#2196F3]">
              {studio?.instagram ?? 'Potwierdzenie terminu'}
            </p>
            <h1 className="mt-0.5 text-lg font-bold text-[#0A192F]">{booking.studioName}</h1>
            <p className="mt-0.5 text-xs text-[#334E68]">
              Klient: <strong className="text-[#0A192F]">{booking.clientName}</strong> •{' '}
              {booking.date}, godz.{' '}
              <span className="font-semibold text-[#0A192F] tabular-nums">
                {booking.time}
              </span>
            </p>
          </div>

          <div className="border-y border-dashed border-[#90CAF9]/60 py-4 space-y-2 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-[#334E68]">Usługa</span>
              <span className="font-semibold text-[#0A192F] text-right">
                {booking.serviceName}
              </span>
            </div>
            {booking.customFieldValue && (
              <div className="flex justify-between gap-4">
                <span className="text-[#334E68]">Szczegóły</span>
                <span className="text-[#0A192F] text-right">{booking.customFieldValue}</span>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <span className="text-[#334E68]">Wartość całkowita</span>
              <span className="tabular-nums text-[#0A192F]">
                {formatPLN(booking.totalPrice)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#334E68]">Dopłata na miejscu</span>
              <span className="tabular-nums text-[#627D98]">
                {formatPLN(remainingOnSite)}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[#334E68]">Zadatek rezerwacyjny</span>
              <span className="font-semibold tabular-nums text-[#0A192F]">
                {formatPLN(booking.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between text-[#334E68]">
              <span>Opłata serwisowa operatora BLIK</span>
              <span className="tabular-nums">
                {booking.serviceFee > 0 ? formatPLN(booking.serviceFee) : '0,00 zł (PRO)'}
              </span>
            </div>
            <div className="flex items-baseline justify-between border-t border-[#E3F2FD] pt-2.5">
              <span className="text-sm font-bold text-[#0A192F]">Razem do zapłaty</span>
              <span className="text-2xl font-bold tabular-nums text-[#0D47A1]">
                {formatPLN(totalToPayNow)}
              </span>
            </div>
          </div>

          {booking.status === 'PAID' || booking.status === 'COMPLETED' ? (
            <div className="rounded-[6px] border border-[#90CAF9]/60 bg-[#E3F2FD]/45 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#0A192F]">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2196F3] text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
                Termin potwierdzony
              </div>
              <p className="text-xs text-[#334E68] leading-relaxed">
                Zadatek został zaksięgowany. Twoje miejsce na{' '}
                <span className="font-semibold text-[#0A192F] tabular-nums">
                  {booking.date} o {booking.time}
                </span>{' '}
                jest zarezerwowane.
              </p>

              {booking.cancelRequested && (
                <div className="rounded-[5px] border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                  Zgłoszono prośbę o zmianę/odwołanie: „{booking.cancelReason}”. Studio
                  skontaktuje się z Tobą.
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadIcs}
                  className="product-link !w-full gap-2"
                >
                  <CalendarPlus className="h-3.5 w-3.5" />
                  Dodaj do kalendarza (.ics)
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-1.5 rounded-[5px] border border-[#90CAF9] bg-white px-3 py-2 text-xs font-medium text-[#0D47A1] hover:bg-[#E3F2FD]"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Drukuj / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCancelForm((v) => !v)}
                    className="inline-flex items-center justify-center rounded-[5px] border border-[#90CAF9] bg-white px-3 py-2 text-xs font-medium text-[#334E68] hover:text-[#0D47A1]"
                  >
                    Zmień termin
                  </button>
                </div>

                {showCancelForm && (
                  <form
                    onSubmit={handleClientCancel}
                    className="mt-2 rounded-[5px] border border-[#90CAF9]/70 bg-white p-3 space-y-2.5"
                  >
                    <label className="block text-[11px] font-medium text-[#334E68]">
                      Wpisz propozycję nowego terminu lub powód odwołania:
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="np. Czy mogę przełożyć wizytę na przyszły wtorek?"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full rounded-[5px] border border-[#90CAF9]/70 px-2.5 py-1.5 text-xs focus:border-[#2196F3] focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={cancelling}
                      className="w-full rounded-[5px] bg-[#0D47A1] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2196F3]"
                    >
                      {cancelling ? 'Wysyłam...' : 'Wyślij prośbę do studia'}
                    </button>
                  </form>
                )}

                <Link
                  href={`/s/${booking.studioSlug}`}
                  className="inline-flex w-full items-center justify-center text-xs font-medium text-[#0D47A1] hover:underline pt-1"
                >
                  Wróć do profilu studia
                </Link>
              </div>
            </div>
          ) : booking.status === 'CANCELLED_FORFEITED' ? (
            <div className="rounded-[6px] border border-red-200 bg-red-50/70 p-4 text-xs text-red-800 space-y-1">
              <p className="font-bold">Wizyta odwołana po terminie regulaminowym</p>
              <p>
                Zgodnie z art. 394 KC zadatek został zatrzymany przez studio. Skontaktuj się
                bezpośrednio w celu ustalenia nowego terminu.
              </p>
            </div>
          ) : (
            <form onSubmit={handlePayBlik} className="space-y-4 pt-1">
              {booking.transferDeclared && (
                <div className="rounded-[5px] border border-[#90CAF9] bg-[#E3F2FD] px-3 py-2.5 text-xs font-medium text-[#0D47A1]">
                  Zgłoszono przelew na telefon BLIK — oczekuje na weryfikację wpłaty przez właściciela studia.
                </div>
              )}
              {errorMsg && (
                <div className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-[#334E68] mb-1">
                  Twój e-mail do potwierdzenia płatności (opcjonalnie)
                </label>
                <input
                  type="email"
                  placeholder="twoj@email.pl"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2.5 rounded-[6px] border border-[#90CAF9]/50 bg-[#F7FBFF] p-3 text-[11px] text-[#334E68] cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-[#90CAF9] accent-[#0D47A1]"
                />
                <span className="leading-relaxed">
                  Akceptuję{' '}
                  <strong className="text-[#0A192F]">Regulamin Zadatku (art. 394 KC)</strong>.
                  Bezpłatna zmiana terminu do{' '}
                  <strong className="text-[#0A192F]">{cancelHours}h</strong> przed wizytą; po
                  tym czasie zadatek przepada.
                </span>
              </label>

              {/* Payment method tabs */}
              <div className="grid grid-cols-2 rounded-[5px] border border-[#90CAF9]/60 bg-[#E3F2FD]/40 p-0.5 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BLIK_CODE')}
                  className={`rounded-[4px] py-2 transition-colors ${
                    paymentMethod === 'BLIK_CODE'
                      ? 'bg-[#0D47A1] text-white'
                      : 'text-[#334E68] hover:text-[#0D47A1]'
                  }`}
                >
                  Kod BLIK (online)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('BLIK_PHONE_TRANSFER')}
                  className={`rounded-[4px] py-2 transition-colors ${
                    paymentMethod === 'BLIK_PHONE_TRANSFER'
                      ? 'bg-[#0D47A1] text-white'
                      : 'text-[#334E68] hover:text-[#0D47A1]'
                  }`}
                >
                  Przelew na telefon BLIK
                </button>
              </div>

              {paymentMethod === 'BLIK_CODE' ? (
                <div className="rounded-[6px] border border-[#90CAF9]/60 bg-[#E3F2FD]/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-[4px] bg-[#0D47A1] px-2 py-0.5 text-[11px] font-bold tracking-wider text-white">
                        BLIK
                      </span>
                      <span className="text-xs font-semibold text-[#0A192F]">
                        Kod z aplikacji banku
                      </span>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-[#2196F3]" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="blikCode" className="text-[11px] text-[#334E68]">
                        6-cyfrowy kod jednorazowy
                      </label>
                      {studio?.isDemo && (
                        <button
                          type="button"
                          onClick={() => setBlikCode('742819')}
                          className="text-[11px] font-semibold text-[#0D47A1] underline underline-offset-2 hover:text-[#2196F3]"
                        >
                          Tryb demo: wpisz 742 819
                        </button>
                      )}
                    </div>
                    <input
                      id="blikCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={7}
                      placeholder="000 000"
                      value={blikCode}
                      onChange={(e) =>
                        setBlikCode(e.target.value.replace(/[^\d\s]/g, '').slice(0, 7))
                      }
                      className="w-full rounded-[5px] border border-[#90CAF9] bg-white px-4 py-3 text-center text-2xl font-bold tracking-[0.35em] text-[#0A192F] placeholder:text-[#90CAF9]/60 focus:border-[#2196F3] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={phase === 'WAITING_BANK'}
                    className="product-link !w-full disabled:opacity-60"
                  >
                    {phase === 'WAITING_BANK'
                      ? 'Oczekiwanie na potwierdzenie w banku...'
                      : `Zapłać BLIK-iem (${formatPLN(totalToPayNow)})`}
                  </button>
                </div>
              ) : (
                <div className="rounded-[6px] border border-[#90CAF9]/60 bg-[#E3F2FD]/40 p-4 space-y-3 text-xs">
                  <p className="font-semibold text-[#0A192F]">
                    Wykonaj natychmiastowy przelew na telefon BLIK:
                  </p>
                  <div className="space-y-2 rounded-[5px] border border-[#90CAF9]/50 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[#334E68]">Numer telefonu BLIK:</span>
                      <button
                        type="button"
                        onClick={() => copyText(studioBlikPhone, 'phone')}
                        className="inline-flex items-center gap-1 font-bold text-[#0D47A1] tabular-nums"
                      >
                        {studioBlikPhone}
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#334E68]">Kwota:</span>
                      <span className="font-bold text-[#0A192F] tabular-nums">
                        {formatPLN(totalToPayNow)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#334E68]">Tytuł przelewu:</span>
                      <button
                        type="button"
                        onClick={() => copyText(transferTitle, 'title')}
                        className="inline-flex items-center gap-1 font-semibold text-[#0D47A1]"
                      >
                        {copiedKey === 'title' ? 'Skopiowano!' : transferTitle}
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={phase === 'WAITING_BANK'}
                    className="product-link !w-full disabled:opacity-60"
                  >
                    {phase === 'WAITING_BANK'
                      ? 'Zapisuję potwierdzenie...'
                      : 'Potwierdzam wysłanie przelewu BLIK'}
                  </button>
                </div>
              )}

              <div className="text-center">
                <button
                  type="button"
                  onClick={async () => {
                    await fetch('/api/bookings', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        bookingId: booking.id,
                        shortCode: booking.shortCode,
                        clientAction: 'cancel',
                        reason: 'Klient zrezygnował przed opłatą',
                      }),
                    });
                    setCancelledUnpaid(true);
                  }}
                  className="text-[11px] text-[#627D98] hover:text-red-600 underline"
                >
                  Rezygnuję — zwolnij ten termin
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="border-t border-[#E3F2FD] bg-[#F7FBFF] px-5 py-3 text-center">
          <Link
            href="/"
            className="text-[11px] text-[#627D98] hover:text-[#0D47A1] transition-colors"
          >
            Zadatkomat — bezpieczny zadatek BLIK (0 zł dla firmy)
          </Link>
        </div>
      </div>
    </div>
  );
}
