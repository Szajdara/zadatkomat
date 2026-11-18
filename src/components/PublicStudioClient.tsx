'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Clock, Globe, MapPin, Phone } from 'lucide-react';
import type { ServiceItem, Studio } from '@/lib/types';
import { formatPLN, getIndustryConfig } from '@/lib/industry';
import { InstagramIcon } from '@/components/Icons';

interface OccupiedSlot {
  date: string;
  time: string;
}

interface PublicStudioClientProps {
  studio: Studio;
  occupiedSlots: OccupiedSlot[];
}

const TIME_SLOTS = ['09:00', '10:30', '12:00', '14:00', '16:00', '17:30'];

function buildUpcomingDays(count: number) {
  const days: { iso: string; dayNum: string; monthShort: string; weekday: string }[] = [];
  const fmtDay = new Intl.DateTimeFormat('pl-PL', { day: '2-digit' });
  const fmtMonth = new Intl.DateTimeFormat('pl-PL', { month: 'short' });
  const fmtWeekday = new Intl.DateTimeFormat('pl-PL', { weekday: 'short' });

  for (let i = 1; i <= count; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      dayNum: fmtDay.format(d),
      monthShort: fmtMonth.format(d),
      weekday: fmtWeekday.format(d),
    });
  }
  return days;
}

export function PublicStudioClient({
  studio,
  occupiedSlots,
}: PublicStudioClientProps) {
  const router = useRouter();
  const industryConfig = getIndustryConfig(studio.industry);
  const upcomingDays = useMemo(() => buildUpcomingDays(7), []);

  const [selectedService, setSelectedService] = useState<ServiceItem>(studio.services[0]);
  const [selectedDate, setSelectedDate] = useState<string>(upcomingDays[0]?.iso ?? '');
  const [selectedTime, setSelectedTime] = useState<string>('12:00');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [wlName, setWlName] = useState('');
  const [wlPhone, setWlPhone] = useState('');
  const [wlDays, setWlDays] = useState('Dowolny dzień w tym tygodniu');
  const [wlSaved, setWlSaved] = useState(false);
  const [wlSubmitting, setWlSubmitting] = useState(false);

  const takenSlots = useMemo(() => {
    const set = new Set<string>();
    for (const slot of occupiedSlots) {
      if (slot.date === selectedDate) {
        set.add(slot.time);
      }
    }
    return set;
  }, [occupiedSlots, selectedDate]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioId: studio.id,
          serviceId: selectedService.id,
          serviceName: selectedService.name,
          clientName,
          clientPhone,
          clientEmail,
          clientNotes,
          customFieldLabel: industryConfig.customFieldLabel,
          customFieldValue,
          date: selectedDate,
          time: selectedTime,
          totalPrice: selectedService.totalPrice,
          depositAmount: selectedService.depositAmount,
          source: 'PUBLIC_PROFILE',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Nie udało się utworzyć rezerwacji.');
      }

      router.push(`/z/${data.booking.shortCode}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Wystąpił błąd.');
      setSubmitting(false);
    }
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setWlSubmitting(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioId: studio.id,
          clientName: wlName,
          clientPhone: wlPhone,
          preferredService: selectedService.name,
          preferredDays: wlDays,
        }),
      });
      if (res.ok) {
        setWlSaved(true);
        setWlName('');
        setWlPhone('');
      }
    } finally {
      setWlSubmitting(false);
    }
  };

  return (
    <div className="snipper-soft-tint w-full min-h-[calc(100vh-140px)] py-10">
      <div className="mx-auto w-[90%] md:w-[80%] max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#334E68]">
          <div className="flex items-center gap-2">
            <Link href="/" className="hover:text-[#0D47A1]">
              Zadatkomat
            </Link>
            <span className="text-[#627D98]">/</span>
            <span className="font-semibold text-[#0A192F]">{studio.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-[5px] border border-[#90CAF9]/60 bg-white px-2.5 py-1 text-[11px] font-medium text-[#0D47A1]">
              {industryConfig.shortLabel}
            </span>
            {studio.plan === 'PRO' && (
              <span className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#90CAF9]/60 bg-[#E3F2FD] px-2.5 py-1 text-[11px] font-medium text-[#0D47A1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2196F3]" />
                0 zł opłaty (PRO)
              </span>
            )}
          </div>
        </div>

        {/* 3-COLUMN BOOKING WIDGET */}
        <form
          onSubmit={handleBook}
          className="rounded-[10px] border border-[#90CAF9]/50 bg-white shadow-xl shadow-[#0D47A1]/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#90CAF9]/35"
        >
          {/* COLUMN 1: HOST INFO & SERVICES */}
          <div className="lg:col-span-4 p-6 space-y-6 bg-[#E3F2FD]/25">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0D47A1] text-xs font-bold text-white">
                  {studio.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-[#2196F3]">{studio.instagram}</p>
                  <h1 className="text-base font-bold text-[#0A192F] leading-tight">
                    {studio.name}
                  </h1>
                </div>
              </div>

              <p className="text-xs text-[#334E68] leading-relaxed">{studio.bio}</p>

              <div className="space-y-1.5 pt-1 text-xs text-[#334E68]">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-[#2196F3]" />
                  <span>{studio.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <InstagramIcon className="h-3.5 w-3.5 text-[#2196F3]" />
                  <span>{studio.instagram}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-[#2196F3]" />
                  <span className="tabular-nums">{studio.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-[#2196F3]" />
                  <span>Zmiana terminu do {studio.cancelPolicyHours}h przed wizytą</span>
                </div>
              </div>
            </div>

            <div className="border-t border-[#90CAF9]/35 pt-5 space-y-2.5">
              <p className="text-xs font-semibold text-[#0A192F]">Wybierz usługę</p>
              <div className="space-y-2">
                {studio.services.map((srv) => {
                  const selected = selectedService.id === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => setSelectedService(srv)}
                      className={`w-full rounded-[6px] border p-3 text-left transition-all ${
                        selected
                          ? 'border-[#0D47A1] bg-white ring-1 ring-[#0D47A1]'
                          : 'border-[#90CAF9]/40 bg-white hover:border-[#2196F3]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-semibold text-[#0A192F]">
                          {srv.name}
                        </span>
                        <span className="text-xs font-bold tabular-nums text-[#0D47A1] shrink-0">
                          {formatPLN(srv.totalPrice)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#334E68] leading-snug">
                        {srv.description}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-[#627D98]">
                        <span>{srv.durationMinutes} min</span>
                        <span className="font-semibold text-[#0D47A1]">
                          Zadatek BLIK: {formatPLN(srv.depositAmount)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 2: DATE & TIME PICKER */}
          <div className="lg:col-span-4 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-[#0A192F]">Dzień i godzina</p>
              <span className="inline-flex items-center gap-1 text-[11px] text-[#627D98]">
                <Globe className="h-3 w-3 text-[#2196F3]" />
                Polska
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7 lg:grid-cols-4">
              {upcomingDays.map((day) => {
                const active = selectedDate === day.iso;
                return (
                  <button
                    key={day.iso}
                    type="button"
                    onClick={() => setSelectedDate(day.iso)}
                    className={`rounded-[5px] border py-2 px-1 text-center transition-colors ${
                      active
                        ? 'border-[#0D47A1] bg-[#0D47A1] text-white'
                        : 'border-[#90CAF9]/50 bg-white text-[#334E68] hover:border-[#2196F3]'
                    }`}
                  >
                    <div className="text-[10px] uppercase opacity-75">{day.weekday}</div>
                    <div className="text-sm font-bold tabular-nums">{day.dayNum}</div>
                    <div className="text-[10px] opacity-75">{day.monthShort}</div>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-[#E3F2FD] pt-4 space-y-2.5">
              <p className="text-xs font-medium text-[#334E68]">
                Dostępne godziny ({selectedDate}):
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isTaken = takenSlots.has(slot);
                  const active = selectedTime === slot && !isTaken;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isTaken}
                      onClick={() => setSelectedTime(slot)}
                      className={`flex items-center justify-between rounded-[5px] border px-3 py-2.5 text-xs font-semibold tabular-nums transition-all ${
                        isTaken
                          ? 'border-[#E3F2FD] bg-[#F7FBFF] text-[#627D98]/60 line-through cursor-not-allowed'
                          : active
                          ? 'border-[#0D47A1] bg-[#0D47A1] text-white'
                          : 'border-[#90CAF9]/60 bg-white text-[#0A192F] hover:border-[#2196F3]'
                      }`}
                    >
                      <span>{slot}</span>
                      {!isTaken && (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            active ? 'bg-[#90CAF9]' : 'bg-[#2196F3]'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* COLUMN 3: CLIENT FORM & DEPOSIT CHECKOUT */}
          <div className="lg:col-span-4 p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[#0A192F]">Twoje dane rezerwacji</p>

              {errorMsg && (
                <div className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  Imię i nazwisko *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Jan Kowalski"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 bg-white px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  Telefon (SMS potwierdzający) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="500 600 700"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 bg-white px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  E-mail na potwierdzenie (opcjonalnie)
                </label>
                <input
                  type="email"
                  placeholder="jan@kowalski.pl"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 bg-white px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  {industryConfig.customFieldLabel} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={industryConfig.customFieldPlaceholder}
                  value={customFieldValue}
                  onChange={(e) => setCustomFieldValue(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 bg-white px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  Uwagi (opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  placeholder={industryConfig.notesPlaceholder}
                  value={clientNotes}
                  onChange={(e) => setClientNotes(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 bg-white px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-[#E3F2FD] pt-4 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-[#334E68]">
                  <span>Wybrany termin</span>
                  <span className="font-semibold text-[#0A192F] tabular-nums">
                    {selectedDate} • {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between text-[#334E68]">
                  <span>Zadatek BLIK teraz</span>
                  <span className="font-bold text-[#0D47A1] tabular-nums">
                    {formatPLN(selectedService.depositAmount)}
                  </span>
                </div>
                {studio.plan === 'START' && (
                  <div className="flex justify-between text-[11px] text-[#627D98]">
                    <span>Opłata serwisowa operatora</span>
                    <span>+4,90 zł</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="product-link !w-full gap-2 disabled:opacity-60"
              >
                {submitting ? 'Tworzę rezerwację...' : 'Potwierdź i przejdź do BLIK'}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </form>

        {/* WAITLIST BAR */}
        <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold text-[#0A192F]">Lista rezerwowa</p>
              <p className="mt-0.5 text-xs text-[#334E68]">
                Brak pasującego terminu? Dopisz się — gdy ktoś odwoła wizytę, wyślemy link do
                zwolnionego miejsca.
              </p>
            </div>

            {wlSaved ? (
              <div className="inline-flex items-center gap-2 rounded-[5px] border border-[#90CAF9] bg-[#E3F2FD]/60 px-3.5 py-2 text-xs font-semibold text-[#0D47A1]">
                <Check className="h-4 w-4 text-[#2196F3]" />
                Dopisano do listy rezerwowej studia {studio.name}.
              </div>
            ) : (
              <form
                onSubmit={handleJoinWaitlist}
                className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:w-[620px]"
              >
                <input
                  type="text"
                  required
                  placeholder="Twoje imię"
                  value={wlName}
                  onChange={(e) => setWlName(e.target.value)}
                  className="rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs focus:border-[#2196F3] focus:outline-none"
                />
                <input
                  type="tel"
                  required
                  placeholder="Telefon"
                  value={wlPhone}
                  onChange={(e) => setWlPhone(e.target.value)}
                  className="rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs tabular-nums focus:border-[#2196F3] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Preferowane dni"
                  value={wlDays}
                  onChange={(e) => setWlDays(e.target.value)}
                  className="rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs focus:border-[#2196F3] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={wlSubmitting}
                  className="rounded-[5px] bg-[#0D47A1] px-3 py-2 text-xs font-medium text-white hover:bg-[#2196F3] transition-colors disabled:opacity-60"
                >
                  {wlSubmitting ? 'Zapisuję...' : 'Dopisz mnie'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
