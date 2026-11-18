'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Copy,
  Link2,
  LogOut,
  MessageCircle,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type {
  Booking,
  BookingStatus,
  ServiceItem,
  Studio,
  StudioPlan,
  SubscriptionPayment,
  WaitlistEntry,
} from '@/lib/types';
import { formatPLN, getIndustryConfig } from '@/lib/industry';

interface SalonPanelClientProps {
  initialStudio: Studio;
  initialBookings: Booking[];
  initialWaitlist: WaitlistEntry[];
}

export function SalonPanelClient({
  initialStudio,
  initialBookings,
  initialWaitlist,
}: SalonPanelClientProps) {
  const router = useRouter();
  const [studio, setStudio] = useState<Studio>(initialStudio);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(initialWaitlist);
  const [activeTab, setActiveTab] = useState<'bookings' | 'settings'>('bookings');
  const [origin, setOrigin] = useState('https://zadatkomat.pl');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const industryConfig = useMemo(
    () => getIndustryConfig(studio.industry),
    [studio.industry]
  );

  // PRO Upgrade Modal state
  const [showProModal, setShowProModal] = useState(false);
  const [proCompanyName, setProCompanyName] = useState(studio.name);
  const [proNip, setProNip] = useState(studio.nip ?? '');
  const [proBlikCode, setProBlikCode] = useState('');
  const [proPaying, setProPaying] = useState(false);
  const [proError, setProError] = useState<string | null>(null);
  const [proReceipt, setProReceipt] = useState<SubscriptionPayment | null>(null);

  const defaultTomorrow = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);

  const [serviceName, setServiceName] = useState(
    studio.services[0]?.name ?? 'Indywidualna wycena z Instagrama'
  );
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [date, setDate] = useState(defaultTomorrow);
  const [time, setTime] = useState('12:00');
  const [totalPrice, setTotalPrice] = useState(studio.services[0]?.totalPrice ?? 600);
  const [depositAmount, setDepositAmount] = useState(
    studio.services[0]?.depositAmount ?? 150
  );
  const [creatingLink, setCreatingLink] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [waitlistAlertMsg, setWaitlistAlertMsg] = useState<string | null>(null);
  const [notifyingWaitlist, setNotifyingWaitlist] = useState(false);

  // Manual waitlist add form
  const [showAddWaitlist, setShowAddWaitlist] = useState(false);
  const [manualWlName, setManualWlName] = useState('');
  const [manualWlPhone, setManualWlPhone] = useState('');
  const [manualWlDays, setManualWlDays] = useState('');
  const [addingWl, setAddingWl] = useState(false);

  // Settings form state
  const [editName, setEditName] = useState(studio.name);
  const [editCity, setEditCity] = useState(studio.city);
  const [editInstagram, setEditInstagram] = useState(studio.instagram);
  const [editPhone, setEditPhone] = useState(studio.phone);
  const [editBlikPhone, setEditBlikPhone] = useState(studio.blikPhone ?? studio.phone);
  const [editBankAccount, setEditBankAccount] = useState(studio.bankAccount ?? '');
  const [editNip, setEditNip] = useState(studio.nip ?? '');
  const [editBio, setEditBio] = useState(studio.bio);
  const [editCancelHours, setEditCancelHours] = useState(studio.cancelPolicyHours);
  const [editServices, setEditServices] = useState<ServiceItem[]>(studio.services);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
  };

  const formatPhoneForWa = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 9) return `48${digits}`;
    return digits;
  };

  const buildDmMessage = (b: Booking) => {
    const link = `${origin}/z/${b.shortCode}`;
    return `Cześć ${b.clientName}! Rezerwuję dla Ciebie termin ${b.date} o godz. ${b.time} na: ${b.serviceName}. Aby zablokować termin w grafiku, opłać proszę zadatek (${b.depositAmount} zł) szybkim BLIK-iem w ciągu 15 minut pod tym linkiem: ${link} — Do zobaczenia! (${b.studioName})`;
  };

  const handleLogout = async () => {
    await fetch('/api/auth/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    router.refresh();
  };

  const handleTogglePlan = async (plan: StudioPlan) => {
    if (studio.plan === plan) return;
    if (plan === 'PRO') {
      setProError(null);
      setProReceipt(null);
      setShowProModal(true);
      return;
    }

    const res = await fetch('/api/studios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_plan',
        studioId: studio.id,
        plan: 'START',
      }),
    });
    const data = await res.json();
    if (res.ok && data.studio) {
      setStudio(data.studio);
    }
  };

  const handlePayProSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setProPaying(true);
    setProError(null);
    try {
      const res = await fetch('/api/studios/subscribe-pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: proCompanyName,
          nip: proNip,
          blikCode: proBlikCode.replace(/\D/g, ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Płatność nie powiodła się.');

      if (data.mode === 'STRIPE_CHECKOUT' && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setStudio(data.studio);
      setProReceipt(data.payment);
      setProBlikCode('');
    } catch (err) {
      setProError(err instanceof Error ? err.message : 'Błąd opłaty PRO.');
    } finally {
      setProPaying(false);
    }
  };

  const handleGenerateDepositLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLink(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioId: studio.id,
          serviceName,
          clientName,
          clientPhone,
          clientNotes,
          customFieldLabel: industryConfig.customFieldLabel,
          customFieldValue,
          date,
          time,
          totalPrice,
          depositAmount,
          source: 'IG_LINK',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się wygenerować linku');

      const created: Booking = data.booking;
      setBookings((prev) => [created, ...prev]);
      setCreatedBooking(created);
      setClientName('');
      setClientPhone('');
      setCustomFieldValue('');
      setClientNotes('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setCreatingLink(false);
    }
  };

  const handleStatusChange = async (bookingId: string, status: BookingStatus) => {
    const res = await fetch('/api/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, status }),
    });
    const data = await res.json();
    if (res.ok && data.booking) {
      setBookings((prev) =>
        prev.map((b) => (b.id === data.booking.id ? data.booking : b))
      );
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    const res = await fetch(`/api/bookings?id=${encodeURIComponent(bookingId)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
    }
  };

  const handleNotifyWaitlist = async () => {
    setNotifyingWaitlist(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'notify',
          studioId: studio.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setWaitlist(data.waitlist);
        setWaitlistAlertMsg(
          data.notifiedCount > 0
            ? `Oznaczono alert dla ${data.notifiedCount} osób z listy rezerwowej.`
            : 'Wszyscy oczekujący zostali już wcześniej powiadomieni.'
        );
      }
    } finally {
      setNotifyingWaitlist(false);
    }
  };

  const handleAddManualWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingWl(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studioId: studio.id,
          clientName: manualWlName,
          clientPhone: manualWlPhone,
          preferredService: serviceName,
          preferredDays: manualWlDays || 'Dowolny termin',
        }),
      });
      const data = await res.json();
      if (res.ok && data.entry) {
        setWaitlist((prev) => [data.entry, ...prev]);
        setManualWlName('');
        setManualWlPhone('');
        setManualWlDays('');
        setShowAddWaitlist(false);
      }
    } finally {
      setAddingWl(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg(null);
    setSettingsError(null);
    try {
      const res = await fetch('/api/studios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          city: editCity,
          instagram: editInstagram,
          phone: editPhone,
          blikPhone: editBlikPhone,
          bankAccount: editBankAccount,
          nip: editNip,
          bio: editBio,
          cancelPolicyHours: editCancelHours,
          services: editServices,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się zapisać zmian.');
      setStudio(data.studio);
      setEditServices(data.studio.services);
      if (data.studio.services[0]) {
        setServiceName(data.studio.services[0].name);
        setTotalPrice(data.studio.services[0].totalPrice);
        setDepositAmount(data.studio.services[0].depositAmount);
      }
      setSettingsMsg('Zapisano ustawienia studia, dane do wypłat i cennik usług.');
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Błąd zapisu.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddService = () => {
    setEditServices((prev) => [
      ...prev,
      {
        id: `srv-${Date.now()}`,
        name: 'Nowa usługa',
        description: 'Krótki opis zabiegu lub zlecenia',
        totalPrice: 400,
        depositAmount: 100,
        durationMinutes: 90,
      },
    ]);
  };

  const handleUpdateService = (
    idx: number,
    field: keyof ServiceItem,
    value: string | number
  ) => {
    setEditServices((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveService = (idx: number) => {
    if (editServices.length <= 1) return;
    setEditServices((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredBookings = useMemo(() => {
    if (statusFilter === 'ALL') return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const kpis = useMemo(() => {
    const paid = bookings.filter(
      (b) => b.status === 'PAID' || b.status === 'COMPLETED'
    );
    const forfeited = bookings.filter((b) => b.status === 'CANCELLED_FORFEITED');
    const pending = bookings.filter((b) => b.status === 'PENDING_PAYMENT');
    const securedMoney = [...paid, ...forfeited].reduce(
      (sum, b) => sum + b.depositAmount,
      0
    );
    const retainedNoShow = forfeited.reduce((sum, b) => sum + b.depositAmount, 0);
    return {
      securedMoney,
      paidCount: paid.length,
      pendingCount: pending.length,
      forfeitedCount: forfeited.length,
      retainedNoShow,
    };
  }, [bookings]);

  const statusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#0D47A1]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2196F3]" />
            Opłacony
          </span>
        );
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#334E68]">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Oczekuje BLIK
          </span>
        );
      case 'CANCELLED_FORFEITED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
            Zatrzymany (no-show)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#627D98]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#90CAF9]" />
            Zakończona
          </span>
        );
    }
  };

  return (
    <div className="snipper-soft-tint w-full min-h-[calc(100vh-140px)] py-8">
      <div className="mx-auto w-[90%] md:w-[80%] max-w-6xl space-y-6">
        {/* STUDIO HEADER */}
        <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white/95 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#627D98]">Panel salonu /</span>
                <h1 className="text-lg font-bold text-[#0A192F]">{studio.name}</h1>
                <span className="text-xs text-[#334E68]">({studio.city})</span>
                {studio.isDemo && (
                  <span className="rounded-[4px] border border-[#90CAF9] bg-[#E3F2FD] px-2 py-0.5 text-[10px] font-semibold text-[#0D47A1]">
                    KONTO DEMO
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#334E68]">
                Zalogowano jako:{' '}
                <span className="font-medium text-[#0A192F]">{studio.ownerEmail}</span>
                {studio.plan === 'PRO' && studio.proExpiresAt && (
                  <span className="ml-2 text-[#2196F3] font-medium">
                    • Plan PRO aktywny do {studio.proExpiresAt}
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="inline-flex rounded-[5px] border border-[#90CAF9]/60 bg-[#E3F2FD]/40 p-0.5">
                <button
                  type="button"
                  onClick={() => handleTogglePlan('START')}
                  className={`rounded-[4px] px-3 py-1 text-[11px] font-medium transition-all ${
                    studio.plan === 'START'
                      ? 'bg-white text-[#0D47A1] shadow-xs font-semibold'
                      : 'text-[#334E68] hover:text-[#0D47A1]'
                  }`}
                >
                  START (0 zł)
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePlan('PRO')}
                  className={`rounded-[4px] px-3 py-1 text-[11px] font-medium transition-all ${
                    studio.plan === 'PRO'
                      ? 'bg-[#0D47A1] text-white shadow-xs font-semibold'
                      : 'text-[#334E68] hover:text-[#0D47A1]'
                  }`}
                >
                  PRO (49 zł)
                </button>
              </div>

              <Link
                href={`/s/${studio.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-[5px] bg-[#0D47A1] px-3.5 py-2 text-xs font-medium text-white hover:bg-[#2196F3] transition-colors"
              >
                Twój profil publiczny
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 rounded-[5px] border border-[#90CAF9]/70 bg-white px-3 py-2 text-xs font-medium text-[#334E68] hover:text-[#0D47A1]"
              >
                <LogOut className="h-3.5 w-3.5" />
                Wyloguj
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E3F2FD] flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'bookings'
                  ? 'bg-[#0D47A1] text-white'
                  : 'text-[#334E68] hover:bg-[#E3F2FD]/60'
              }`}
            >
              Rezerwacje & Linki BLIK
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`rounded-[5px] px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab === 'settings'
                  ? 'bg-[#0D47A1] text-white'
                  : 'text-[#334E68] hover:bg-[#E3F2FD]/60'
              }`}
            >
              Cennik, Wypłaty & Ustawienia ({studio.services.length})
            </button>
          </div>
        </div>

        {/* PRO SUBSCRIPTION PAYMENT MODAL */}
        {showProModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-[10px] border border-[#90CAF9] bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#E3F2FD] pb-3">
                <h2 className="text-base font-bold text-[#0A192F]">
                  Aktywacja Planu PRO (49 zł / 30 dni)
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProModal(false)}
                  className="text-[#627D98] hover:text-[#0A192F]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {proReceipt ? (
                <div className="space-y-4 text-xs">
                  <div className="rounded-[6px] border border-[#90CAF9] bg-[#E3F2FD]/60 p-4 space-y-1.5">
                    <p className="font-bold text-[#0D47A1] text-sm">
                      Plan PRO aktywowany!
                    </p>
                    <p className="text-[#334E68]">
                      Faktura nr: <strong className="text-[#0A192F]">{proReceipt.invoiceNumber}</strong>
                    </p>
                    <p className="text-[#334E68]">
                      Firma: {proReceipt.companyName} (NIP: {proReceipt.nip})
                    </p>
                    <p className="text-[#334E68]">
                      Kwota opłacona BLIK: <strong>{proReceipt.amount} zł</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProModal(false)}
                    className="product-link !w-full"
                  >
                    Zamknij i wróć do panelu
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePayProSubscription} className="space-y-3.5 text-xs">
                  <p className="text-[#334E68] leading-relaxed">
                    W Planie PRO Twoi klienci nie dopłacają 4,90 zł opłaty operatora, a
                    automatyczne przypomnienia SMS i Lista Rezerwowa są w pełni odblokowane.
                  </p>

                  {proError && (
                    <div className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-red-700 font-medium">
                      {proError}
                    </div>
                  )}

                  <div>
                    <label className="block font-medium text-[#334E68]">
                      Nazwa firmy (do rachunku / faktury) *
                    </label>
                    <input
                      type="text"
                      required
                      value={proCompanyName}
                      onChange={(e) => setProCompanyName(e.target.value)}
                      className="mt-1 w-full rounded-[5px] border border-[#90CAF9] px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#334E68]">
                      NIP (opcjonalnie przy działalności nierejestrowanej)
                    </label>
                    <input
                      type="text"
                      placeholder="np. 5250001122"
                      value={proNip}
                      onChange={(e) => setProNip(e.target.value)}
                      className="mt-1 w-full rounded-[5px] border border-[#90CAF9] px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="font-medium text-[#334E68]">
                        6-cyfrowy kod BLIK (49,00 zł) *
                      </label>
                      {studio.isDemo && (
                        <button
                          type="button"
                          onClick={() => setProBlikCode('742819')}
                          className="text-[#0D47A1] underline"
                        >
                          Demo: 742 819
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      placeholder="000000"
                      value={proBlikCode}
                      onChange={(e) =>
                        setProBlikCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                      }
                      className="w-full rounded-[5px] border border-[#90CAF9] px-3 py-2.5 text-center text-lg font-bold tracking-[0.35em] focus:border-[#2196F3] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={proPaying}
                    className="product-link !w-full disabled:opacity-60"
                  >
                    {proPaying ? 'Autoryzacja BLIK...' : 'Opłać 49,00 zł BLIK-iem i włącz PRO'}
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' ? (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {settingsMsg && (
              <div className="rounded-[5px] border border-[#90CAF9] bg-[#E3F2FD] px-4 py-2.5 text-xs font-semibold text-[#0D47A1]">
                {settingsMsg}
              </div>
            )}
            {settingsError && (
              <div className="rounded-[5px] border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
                {settingsError}
              </div>
            )}

            <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden">
              <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5">
                <h2 className="text-sm font-bold text-[#0A192F]">
                  Dane publiczne i wypłaty zadatków (/s/{studio.slug})
                </h2>
              </div>

              <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Nazwa studia
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Miasto
                  </label>
                  <input
                    type="text"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={editInstagram}
                    onChange={(e) => setEditInstagram(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Telefon kontaktowy
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0D47A1]">
                    Telefon do przelewów na telefon BLIK
                  </label>
                  <input
                    type="tel"
                    placeholder="+48 500 600 700"
                    value={editBlikPhone}
                    onChange={(e) => setEditBlikPhone(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9] bg-[#F7FBFF] px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Numer konta bankowego do wypłat (IBAN)
                  </label>
                  <input
                    type="text"
                    placeholder="PL 00 1020 ..."
                    value={editBankAccount}
                    onChange={(e) => setEditBankAccount(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    NIP firmy (do faktur PRO)
                  </label>
                  <input
                    type="text"
                    placeholder="np. 5250001122"
                    value={editNip}
                    onChange={(e) => setEditNip(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Bezpłatna zmiana terminu (godzin przed wizytą)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={editCancelHours}
                    onChange={(e) => setEditCancelHours(Number(e.target.value))}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#334E68]">
                    Opis studia (bio na profilu rezerwacji)
                  </label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden">
              <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#0A192F]">
                    Cennik usług i zadatków
                  </h2>
                  <p className="text-[11px] text-[#334E68]">
                    Ustaw własne usługi, ceny całkowite i wymagany zadatek BLIK
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="inline-flex items-center gap-1 rounded-[5px] border border-[#90CAF9] bg-white px-3 py-1.5 text-xs font-semibold text-[#0D47A1] hover:bg-[#E3F2FD]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Dodaj usługę
                </button>
              </div>

              <div className="divide-y divide-[#E3F2FD]">
                {editServices.map((srv, idx) => (
                  <div key={srv.id} className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[#627D98]">
                        Usługa #{idx + 1}
                      </span>
                      {editServices.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveService(idx)}
                          className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Usuń
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                      <div className="sm:col-span-5">
                        <label className="block text-[11px] font-medium text-[#334E68]">
                          Nazwa usługi
                        </label>
                        <input
                          type="text"
                          required
                          value={srv.name}
                          onChange={(e) =>
                            handleUpdateService(idx, 'name', e.target.value)
                          }
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-1.5 text-xs focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-[#334E68]">
                          Cena (zł)
                        </label>
                        <input
                          type="number"
                          min={20}
                          required
                          value={srv.totalPrice}
                          onChange={(e) =>
                            handleUpdateService(idx, 'totalPrice', Number(e.target.value))
                          }
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-1.5 text-xs tabular-nums focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-medium text-[#334E68]">
                          Zadatek BLIK (zł)
                        </label>
                        <input
                          type="number"
                          min={10}
                          required
                          value={srv.depositAmount}
                          onChange={(e) =>
                            handleUpdateService(
                              idx,
                              'depositAmount',
                              Number(e.target.value)
                            )
                          }
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-1.5 text-xs font-bold tabular-nums focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-[#334E68]">
                          Czas (min)
                        </label>
                        <input
                          type="number"
                          min={15}
                          step={15}
                          required
                          value={srv.durationMinutes}
                          onChange={(e) =>
                            handleUpdateService(
                              idx,
                              'durationMinutes',
                              Number(e.target.value)
                            )
                          }
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-1.5 text-xs tabular-nums focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-12">
                        <input
                          type="text"
                          placeholder="Krótki opis usługi..."
                          value={srv.description}
                          onChange={(e) =>
                            handleUpdateService(idx, 'description', e.target.value)
                          }
                          className="w-full rounded-[5px] border border-[#90CAF9]/50 bg-[#F7FBFF] px-3 py-1.5 text-xs focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#90CAF9]/35 bg-[#E3F2FD]/35 px-5 py-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="product-link disabled:opacity-60"
                >
                  {savingSettings ? 'Zapisuję zmiany...' : 'Zapisz dane i cennik'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* KPI STRIP */}
            <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white/95 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#90CAF9]/35">
              <div className="p-5">
                <p className="text-[11px] font-medium text-[#334E68]">
                  Zabezpieczone zadatki
                </p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-[#0D47A1]">
                  {formatPLN(kpis.securedMoney)}
                </p>
                <p className="mt-0.5 text-[11px] text-[#627D98]">przychód z zadatków</p>
              </div>
              <div className="p-5">
                <p className="text-[11px] font-medium text-[#334E68]">
                  Potwierdzone wizyty
                </p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-[#0A192F]">
                  {kpis.paidCount}
                </p>
                <p className="mt-0.5 text-[11px] text-[#627D98]">opłacone BLIK</p>
              </div>
              <div className="p-5">
                <p className="text-[11px] font-medium text-[#334E68]">Oczekujące linki</p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-[#2196F3]">
                  {kpis.pendingCount}
                </p>
                <p className="mt-0.5 text-[11px] text-[#627D98]">okno 15 min</p>
              </div>
              <div className="p-5">
                <p className="text-[11px] font-medium text-[#334E68]">
                  Zatrzymane (no-show)
                </p>
                <p className="mt-1.5 text-2xl font-bold tabular-nums text-[#0A192F]">
                  {formatPLN(kpis.retainedNoShow)}
                </p>
                <p className="mt-0.5 text-[11px] text-[#627D98]">
                  {kpis.forfeitedCount} odwołań po czasie
                </p>
              </div>
            </div>

            {/* GENERATOR + WAITLIST */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7 rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden">
                <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5">
                  <h2 className="text-sm font-bold text-[#0A192F]">
                    Generator linku zadatku (IG DM / WhatsApp)
                  </h2>
                  <p className="text-[11px] text-[#334E68]">
                    Ustal termin i kwotę po wycenie w wiadomości — system wygeneruje gotowy
                    tekst
                  </p>
                </div>

                <div className="p-5 sm:p-6 space-y-5">
                  {errorMsg && (
                    <div className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <p className="text-[11px] font-medium text-[#334E68] mb-2">
                      Szablon z Twojego cennika:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {studio.services.map((srv) => (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => {
                            setServiceName(srv.name);
                            setTotalPrice(srv.totalPrice);
                            setDepositAmount(srv.depositAmount);
                          }}
                          className={`rounded-[5px] border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            serviceName === srv.name
                              ? 'border-[#0D47A1] bg-[#0D47A1] text-white'
                              : 'border-[#90CAF9]/60 bg-[#F7FBFF] text-[#334E68] hover:border-[#2196F3]'
                          }`}
                        >
                          {srv.name} ({srv.depositAmount} zł)
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleGenerateDepositLink} className="space-y-3.5">
                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-[#334E68]">
                          Nazwa usługi / projektu
                        </label>
                        <input
                          type="text"
                          required
                          value={serviceName}
                          onChange={(e) => setServiceName(e.target.value)}
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334E68]">
                          Imię klienta
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="np. Karolina Nowak"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334E68]">
                          Telefon klienta
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="501 234 567"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-[#334E68]">
                          {industryConfig.customFieldLabel}
                        </label>
                        <input
                          type="text"
                          placeholder={industryConfig.customFieldPlaceholder}
                          value={customFieldValue}
                          onChange={(e) => setCustomFieldValue(e.target.value)}
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334E68]">
                          Data
                        </label>
                        <input
                          type="date"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334E68]">
                          Godzina
                        </label>
                        <input
                          type="time"
                          required
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#334E68]">
                          Wycena całkowita (zł)
                        </label>
                        <input
                          type="number"
                          min={20}
                          required
                          value={totalPrice}
                          onChange={(e) => setTotalPrice(Number(e.target.value))}
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[#0D47A1]">
                          Wymagany zadatek BLIK (zł)
                        </label>
                        <input
                          type="number"
                          min={10}
                          required
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          className="mt-1 w-full rounded-[5px] border border-[#2196F3] bg-[#E3F2FD]/45 px-3 py-2 text-sm font-bold text-[#0D47A1] tabular-nums focus:border-[#0D47A1] focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-[#334E68]">
                          Dodatkowe ustalenia
                        </label>
                        <input
                          type="text"
                          placeholder={industryConfig.notesPlaceholder}
                          value={clientNotes}
                          onChange={(e) => setClientNotes(e.target.value)}
                          className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={creatingLink}
                      className="product-link !w-full gap-2 disabled:opacity-60"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      {creatingLink
                        ? 'Generowanie linku...'
                        : 'Wygeneruj link BLIK + wiadomość DM'}
                    </button>
                  </form>

                  {createdBooking && (
                    <div className="rounded-[6px] border border-[#90CAF9] bg-[#E3F2FD]/50 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1]">
                          <span className="h-2 w-2 rounded-full bg-[#2196F3]" />
                          Wygenerowano: /z/{createdBooking.shortCode}
                        </span>
                        <Link
                          href={`/z/${createdBooking.shortCode}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D47A1] underline"
                        >
                          Otwórz płatność
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      <pre className="whitespace-pre-wrap rounded-[5px] border border-[#90CAF9]/60 bg-white p-3 font-sans text-xs text-[#334E68] leading-relaxed">
                        {buildDmMessage(createdBooking)}
                      </pre>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyText(buildDmMessage(createdBooking), 'dm-msg')}
                          className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#0D47A1] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2196F3]"
                        >
                          {copiedId === 'dm-msg' ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-[#90CAF9]" />
                              Skopiowano
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Kopiuj wiadomość DM
                            </>
                          )}
                        </button>
                        <a
                          href={`https://wa.me/${formatPhoneForWa(createdBooking.clientPhone)}?text=${encodeURIComponent(
                            buildDmMessage(createdBooking)
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#90CAF9] bg-white px-3 py-1.5 text-xs font-medium text-[#0D47A1] hover:bg-[#E3F2FD]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Wyślij na WhatsApp
                        </a>
                        <a
                          href={`sms:${createdBooking.clientPhone}?body=${encodeURIComponent(
                            buildDmMessage(createdBooking)
                          )}`}
                          className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#90CAF9] bg-white px-3 py-1.5 text-xs font-medium text-[#334E68] hover:bg-[#E3F2FD]"
                        >
                          Wyślij SMS
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* WAITLIST CARD */}
              <div className="lg:col-span-5 rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-[#0A192F]">Lista Rezerwowa</h2>
                      <p className="text-[11px] text-[#334E68]">
                        Natychmiastowe wypełnianie odwołanych okienek
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddWaitlist((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-[4px] border border-[#90CAF9] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#0D47A1] hover:bg-[#E3F2FD]"
                    >
                      <Plus className="h-3 w-3" />
                      Dodaj
                    </button>
                  </div>

                  <div className="p-5 space-y-2.5">
                    {showAddWaitlist && (
                      <form
                        onSubmit={handleAddManualWaitlist}
                        className="rounded-[6px] border border-[#90CAF9] bg-[#F7FBFF] p-3 space-y-2 text-xs"
                      >
                        <input
                          type="text"
                          required
                          placeholder="Imię klienta"
                          value={manualWlName}
                          onChange={(e) => setManualWlName(e.target.value)}
                          className="w-full rounded-[4px] border border-[#90CAF9]/70 bg-white px-2.5 py-1.5"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="Telefon"
                          value={manualWlPhone}
                          onChange={(e) => setManualWlPhone(e.target.value)}
                          className="w-full rounded-[4px] border border-[#90CAF9]/70 bg-white px-2.5 py-1.5 tabular-nums"
                        />
                        <input
                          type="text"
                          placeholder="Kiedy pasuje (np. Piątki po 15:00)"
                          value={manualWlDays}
                          onChange={(e) => setManualWlDays(e.target.value)}
                          className="w-full rounded-[4px] border border-[#90CAF9]/70 bg-white px-2.5 py-1.5"
                        />
                        <button
                          type="submit"
                          disabled={addingWl}
                          className="w-full rounded-[4px] bg-[#0D47A1] py-1.5 font-semibold text-white"
                        >
                          {addingWl ? 'Dodaję...' : 'Zapisz na listę'}
                        </button>
                      </form>
                    )}

                    {waitlistAlertMsg && (
                      <div className="rounded-[5px] border border-[#90CAF9] bg-[#E3F2FD] px-3 py-2 text-xs font-medium text-[#0D47A1]">
                        {waitlistAlertMsg}
                      </div>
                    )}

                    {waitlist.length === 0 ? (
                      <div className="rounded-[6px] border border-dashed border-[#90CAF9] p-6 text-center text-xs text-[#334E68]">
                        Brak zapisów na listę rezerwową. Klienci mogą dopisać się na{' '}
                        <Link
                          href={`/s/${studio.slug}`}
                          className="font-semibold text-[#0D47A1] underline"
                        >
                          Twoim profilu publicznym
                        </Link>
                        .
                      </div>
                    ) : (
                      waitlist.map((entry) => {
                        const alertMsg = `Cześć ${entry.clientName}! Zwolnił się nam termin w ${studio.name} (${entry.preferredService}). Chcesz go zająć? Rezerwacja tutaj: ${origin}/s/${studio.slug}`;
                        return (
                          <div
                            key={entry.id}
                            className="rounded-[6px] border border-[#90CAF9]/45 p-3 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[#0A192F]">
                                {entry.clientName}
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-[10px] text-[#334E68]">
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    entry.notified ? 'bg-[#2196F3]' : 'bg-amber-500'
                                  }`}
                                />
                                {entry.notified ? 'Powiadomiono' : 'Oczekuje'}
                              </span>
                            </div>
                            <p className="text-[#334E68]">
                              <span className="tabular-nums font-medium">
                                {entry.clientPhone}
                              </span>{' '}
                              • {entry.preferredService}
                            </p>
                            <p className="text-[11px] text-[#627D98]">{entry.preferredDays}</p>
                            <div className="flex gap-2 pt-1">
                              <a
                                href={`https://wa.me/${formatPhoneForWa(
                                  entry.clientPhone
                                )}?text=${encodeURIComponent(alertMsg)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-[4px] border border-[#90CAF9]/70 px-2 py-0.5 text-[10px] font-semibold text-[#0D47A1] hover:bg-[#E3F2FD]"
                              >
                                WhatsApp
                              </a>
                              <a
                                href={`sms:${entry.clientPhone}?body=${encodeURIComponent(
                                  alertMsg
                                )}`}
                                className="rounded-[4px] border border-[#90CAF9]/70 px-2 py-0.5 text-[10px] font-semibold text-[#334E68] hover:bg-[#E3F2FD]"
                              >
                                SMS
                              </a>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="border-t border-[#90CAF9]/35 bg-[#F7FBFF] p-4 space-y-2">
                  <button
                    type="button"
                    disabled={notifyingWaitlist || waitlist.length === 0}
                    onClick={handleNotifyWaitlist}
                    className="product-link !w-full disabled:opacity-40"
                  >
                    {notifyingWaitlist
                      ? 'Wysyłam powiadomienia...'
                      : 'Zwolnił się termin — oznacz alert dla listy'}
                  </button>
                  <p className="text-center text-[11px] text-[#627D98]">
                    {studio.plan === 'PRO'
                      ? 'Plan PRO aktywny — szybki alert SMS/WhatsApp'
                      : 'Plan START — wyślij wiadomość przez WhatsApp lub SMS powyżej'}
                  </p>
                </div>
              </div>
            </div>

            {/* BOOKINGS TABLE */}
            <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden">
              <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-[#0A192F]">
                    Rezerwacje i zadatki ({bookings.length})
                  </h2>
                </div>

                <div className="flex flex-wrap gap-1">
                  {(
                    [
                      ['ALL', 'Wszystkie'],
                      ['PENDING_PAYMENT', 'Oczekuje BLIK'],
                      ['PAID', 'Opłacone'],
                      ['CANCELLED_FORFEITED', 'Zatrzymane'],
                      ['COMPLETED', 'Zakończone'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStatusFilter(key)}
                      className={`rounded-[5px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                        statusFilter === key
                          ? 'bg-[#0D47A1] text-white'
                          : 'bg-white border border-[#90CAF9]/60 text-[#334E68] hover:border-[#2196F3]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E3F2FD] bg-[#F7FBFF] text-[10px] uppercase tracking-wider text-[#627D98]">
                      <th className="py-3 px-5">Klient</th>
                      <th className="py-3 px-4">Termin</th>
                      <th className="py-3 px-4">Zadatek</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-5 text-right">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3F2FD]">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-[#F7FBFF]">
                        <td className="py-3.5 px-5">
                          <div className="font-semibold text-[#0A192F]">{b.clientName}</div>
                          <div className="text-[11px] text-[#334E68]">
                            {b.serviceName} •{' '}
                            <span className="tabular-nums">{b.clientPhone}</span>
                          </div>
                          {b.transferDeclared && b.status === 'PENDING_PAYMENT' && (
                            <div className="mt-1 rounded bg-[#E3F2FD] border border-[#90CAF9] px-2 py-0.5 text-[10px] font-medium text-[#0D47A1]">
                              Klient zgłosił przelew na telefon BLIK — sprawdź konto i kliknij Zatwierdź wpłatę
                            </div>
                          )}
                          {b.cancelRequested && (
                            <div className="mt-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                              Prośba klienta: {b.cancelReason}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] tabular-nums">
                          <div className="font-semibold text-[#0A192F]">{b.date}</div>
                          <div className="text-[#334E68]">{b.time}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap tabular-nums">
                          <div className="font-bold text-[#0D47A1]">
                            {formatPLN(b.depositAmount)}
                          </div>
                          <div className="text-[10px] text-[#627D98]">
                            z {formatPLN(b.totalPrice)}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {statusBadge(b.status)}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex flex-wrap justify-end items-center gap-1.5">
                            <Link
                              href={`/z/${b.shortCode}`}
                              target="_blank"
                              className="rounded-[5px] border border-[#90CAF9]/70 bg-white px-2 py-1 text-[11px] font-medium text-[#0D47A1] hover:bg-[#E3F2FD]"
                            >
                              /z/{b.shortCode}
                            </Link>
                            <a
                              href={`https://wa.me/${formatPhoneForWa(
                                b.clientPhone
                              )}?text=${encodeURIComponent(buildDmMessage(b))}`}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-[5px] border border-[#90CAF9]/70 bg-white px-2 py-1 text-[11px] font-medium text-[#0D47A1] hover:bg-[#E3F2FD]"
                            >
                              WhatsApp
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText(buildDmMessage(b), b.id)}
                              className="rounded-[5px] border border-[#90CAF9]/70 bg-white px-2 py-1 text-[11px] font-medium text-[#334E68] hover:bg-[#E3F2FD]"
                            >
                              {copiedId === b.id ? 'Skopiowano' : 'Kopiuj DM'}
                            </button>
                            {b.status === 'PENDING_PAYMENT' && (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(b.id, 'PAID')}
                                className="rounded-[5px] bg-[#2196F3] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#0D47A1]"
                              >
                                Zatwierdź wpłatę
                              </button>
                            )}
                            {b.status === 'PAID' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(b.id, 'COMPLETED')}
                                  className="rounded-[5px] bg-[#0D47A1] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#2196F3]"
                                >
                                  Zakończ
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleStatusChange(b.id, 'CANCELLED_FORFEITED')
                                  }
                                  className="rounded-[5px] border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                                >
                                  No-show
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteBooking(b.id)}
                              title="Usuń rezerwację i zwolnij termin"
                              className="rounded-[5px] border border-black/10 bg-white p-1 text-[#627D98] hover:text-red-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-[#627D98]">
                          Brak rezerwacji w wybranym widoku.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
