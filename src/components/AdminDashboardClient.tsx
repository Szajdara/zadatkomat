'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Check, Copy, LogOut, Save } from 'lucide-react';
import type {
  Booking,
  IndustryType,
  PlatformConfig,
  PlatformStats,
  Studio,
  SubscriptionPayment,
} from '@/lib/types';
import { formatPLN, getIndustryConfig } from '@/lib/industry';

interface AdminDashboardClientProps {
  initialStudios: Studio[];
  initialBookings: Booking[];
  initialStats: PlatformStats;
  initialSubscriptions: SubscriptionPayment[];
  initialConfig: PlatformConfig;
}

export function AdminDashboardClient({
  initialStudios,
  initialBookings,
  initialStats,
  initialSubscriptions,
  initialConfig,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [studios, setStudios] = useState<Studio[]>(initialStudios);
  const [stats, setStats] = useState<PlatformStats>(initialStats);
  const [subscriptions] = useState<SubscriptionPayment[]>(initialSubscriptions);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('https://zadatkomat.pl');
  const [activeTemplateTab, setActiveTemplateTab] = useState<'ig' | 'maps' | 'followup'>('ig');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Live Platform Config State
  const [cfgStripeKey, setCfgStripeKey] = useState(initialConfig.stripeSecretKey ?? '');
  const [cfgBlikPhone, setCfgBlikPhone] = useState(initialConfig.platformBlikPhone);
  const [cfgBankAccount, setCfgBankAccount] = useState(initialConfig.platformBankAccount);
  const [cfgResendKey, setCfgResendKey] = useState(initialConfig.resendApiKey ?? '');
  const [cfgSmsToken, setCfgSmsToken] = useState(initialConfig.smsApiToken ?? '');
  const [cfgServiceFee, setCfgServiceFee] = useState(initialConfig.serviceFeePln);
  const [cfgProPrice, setCfgProPrice] = useState(initialConfig.proPlanPricePln);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState<string | null>(null);

  // Simulator
  const [simStudios, setSimStudios] = useState(40);
  const [simDailyBookings, setSimDailyBookings] = useState(2);
  const [simProPercent, setSimProPercent] = useState(25);

  const proCount = Math.round((simStudios * simProPercent) / 100);
  const startCount = Math.max(0, simStudios - proCount);
  const monthlyStartTx = startCount * simDailyBookings * 25;
  const monthlyTxProfit = monthlyStartTx * 2.5;
  const monthlyMrr = proCount * cfgProPrice;
  const monthlyTotalProfit = monthlyTxProfit + monthlyMrr;
  const yearlyTotalProfit = monthlyTotalProfit * 12;

  // Cold-DM machine
  const [prospectName, setProspectName] = useState('Black Ink Wrocław');
  const [prospectCity, setProspectCity] = useState('Wrocław');
  const [prospectIndustry, setProspectIndustry] = useState<IndustryType>('tattoo');
  const [prospectIg, setProspectIg] = useState('@blackink.wroclaw');
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [createdDemoStudio, setCreatedDemoStudio] = useState<Studio | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  const activeSlug =
    createdDemoStudio?.slug ??
    (prospectIndustry === 'tattoo'
      ? 'ink-soul-tattoo'
      : prospectIndustry === 'detailing'
      ? 'apex-detailing'
      : 'lapka-groomer');
  const demoLink = `${origin}/s/${activeSlug}`;

  const copyText = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigMsg(null);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripeSecretKey: cfgStripeKey,
          platformBlikPhone: cfgBlikPhone,
          platformBankAccount: cfgBankAccount,
          resendApiKey: cfgResendKey,
          smsApiToken: cfgSmsToken,
          serviceFeePln: cfgServiceFee,
          proPlanPricePln: cfgProPrice,
        }),
      });
      if (res.ok) {
        setConfigMsg('Zapisano ustawienia bramek płatności i powiadomień w bazie.');
        router.refresh();
      }
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreateDemoForProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prospectName.trim()) return;
    setCreatingDemo(true);
    setDemoError(null);
    try {
      const res = await fetch('/api/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prospectName,
          industry: prospectIndustry,
          city: prospectCity,
          instagram: prospectIg,
          plan: 'START',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd tworzenia demo');
      setStudios((prev) => [...prev, data.studio]);
      setStats(data.stats);
      setCreatedDemoStudio(data.studio);
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Błąd');
    } finally {
      setCreatingDemo(false);
    }
  };

  const industryWord =
    prospectIndustry === 'tattoo'
      ? 'sesje tatuażu'
      : prospectIndustry === 'detailing'
      ? 'zlecenia detailingu/PPF'
      : prospectIndustry === 'groomer'
      ? 'wizyty pielęgnacji psów'
      : 'wizyty';

  const templates = {
    ig: {
      id: 'pitch-ig',
      label: '01 / IG DM',
      hint: 'Najwyższa konwersja — od razu z gotowym profilem demo',
      text: `Cześć ekipa ${prospectName}! Widziałem Wasz profil (${prospectIg}) — świetne realizacje. Mam szybkie pytanie: czy zdarza się Wam jeszcze, że ktoś umawia ${industryWord} w wiadomości prywatnej i potem nie wpłaca zadatku albo nie przychodzi? Zbudowałem dla takich studiów proste narzędzie za 0 zł abonamentu — tworzycie link zadatku BLIK w 10 sekund, a klient ma 15 min na wpłatę. Przygotowałem gotowe demo pod Waszą nazwą: ${demoLink}`,
    },
    maps: {
      id: 'pitch-maps',
      label: '02 / Google Maps',
      hint: 'Do firm bez rezerwacji online znalezionych w Mapach Google',
      text: `Dzień dobry! Znalazłem ${prospectName} w Google Maps (${prospectCity}). Udostępniamy lekki system Zadatkomat — 0 zł/mies. abonamentu i 0% prowizji od Waszej stawki. Klient po prostu dopłaca 4,90 zł opłaty operatora przy szybkim BLIK-u, a Wy macie pewność, że termin nie przepadnie. Gotowy podgląd dla Was: ${demoLink}`,
    },
    followup: {
      id: 'pitch-followup',
      label: '03 / Follow-up',
      hint: 'Przypomnienie po 3 dniach z argumentem Listy Rezerwowej',
      text: `Hej ${prospectName}, podbijam wiadomość sprzed paru dni. Wrzuciliśmy też funkcję Listy Rezerwowej — jak ktoś w ostatniej chwili odwoła wizytę, jednym kliknięciem wysyłacie info do oczekujących i kto pierwszy wpłaci zadatek BLIK, ten bierze termin. Gdybyście chcieli przetestować u siebie za 0 zł na jednym kliencie, dajcie znać.`,
    },
  };

  const activeTemplate = templates[activeTemplateTab];

  return (
    <div className="snipper-soft-tint w-full min-h-[calc(100vh-140px)] py-8">
      <div className="mx-auto w-[90%] md:w-[80%] max-w-6xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[#90CAF9]/40 pb-5">
          <div>
            <p className="text-xs font-semibold text-[#2196F3]">
              Panel Właściciela SaaS • Zarobki na żywo
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0A192F]">
              Centrum Zarabiania („grosik do grosika”)
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/panel"
              className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#0D47A1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2196F3] transition-colors"
            >
              Panel Salonu
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/auth/admin', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'logout' }),
                });
                router.refresh();
              }}
              className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#90CAF9] bg-white px-3.5 py-2 text-xs font-medium text-[#334E68] hover:text-[#0D47A1]"
            >
              <LogOut className="h-3.5 w-3.5" />
              Wyloguj z Admina
            </button>
          </div>
        </div>

        {/* FINANCIAL KPI STRIP */}
        <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white/95 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#90CAF9]/35">
          <div className="p-5">
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#334E68]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2196F3]" />
              Łączny zysk live
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-[#0D47A1]">
              {formatPLN(stats.totalPlatformRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-[#627D98] tabular-nums">
              tx: {formatPLN(stats.totalTransactionNetProfit)} + mrr:{' '}
              {formatPLN(stats.monthlyMrrRevenue)}
            </p>
          </div>

          <div className="p-5">
            <p className="text-[11px] font-medium text-[#334E68]">
              Zysk z opłat BLIK (2,50 zł/szt.)
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#0A192F]">
              +{formatPLN(stats.totalTransactionNetProfit)}
            </p>
            <p className="mt-1 text-[11px] text-[#627D98] tabular-nums">
              brutto {formatPLN(stats.totalServiceFeesCollected)} / stripe ~
              {formatPLN(stats.totalStripeFeesEstimate)} ({stats.paidWithFeeCount} tx)
            </p>
          </div>

          <div className="p-5">
            <p className="text-[11px] font-medium text-[#334E68]">
              Abonament MRR ({cfgProPrice} zł/mies.)
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#0A192F]">
              {formatPLN(stats.monthlyMrrRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-[#627D98] tabular-nums">
              {stats.proStudios} PRO • {stats.startStudios} START
            </p>
          </div>

          <div className="p-5">
            <p className="text-[11px] font-medium text-[#334E68]">
              Wolumen zadatków salonów
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-[#0A192F]">
              {formatPLN(stats.totalDepositsProcessed)}
            </p>
            <p className="mt-1 text-[11px] text-[#627D98] tabular-nums">
              {stats.paidBookingsCount} opłaconych w {stats.totalStudios} studiach
            </p>
          </div>
        </div>

        {/* LIVE GATEWAY & NOTIFICATION CONFIG */}
        <form
          onSubmit={handleSaveConfig}
          className="rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden"
        >
          <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#0A192F]">
                Konfiguracja Bramek Płatności i Powiadomień (Live)
              </h2>
              <p className="text-[11px] text-[#334E68]">
                Podłącz klucze API, aby prawdziwi klienci płacili przez Stripe BLIK i
                otrzymywali automatyczne e-maile / SMS-y
              </p>
            </div>
            <button
              type="submit"
              disabled={savingConfig}
              className="inline-flex items-center gap-1.5 rounded-[5px] bg-[#0D47A1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2196F3] disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {savingConfig ? 'Zapisuję...' : 'Zapisz konfigurację'}
            </button>
          </div>

          {configMsg && (
            <div className="border-b border-[#90CAF9]/40 bg-[#E3F2FD] px-5 py-2.5 text-xs font-semibold text-[#0D47A1]">
              {configMsg}
            </div>
          )}

          <div className="p-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
            <div className="lg:col-span-2">
              <label className="block font-medium text-[#334E68]">
                Stripe Secret Key (sk_live_... lub sk_test_...)
              </label>
              <input
                type="password"
                placeholder="Wpisz klucz Stripe, aby włączyć płatności kartą i BLIK"
                value={cfgStripeKey}
                onChange={(e) => setCfgStripeKey(e.target.value)}
                className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 focus:border-[#2196F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-[#334E68]">
                Twój telefon BLIK (do wpłat bezpośrednich)
              </label>
              <input
                type="text"
                value={cfgBlikPhone}
                onChange={(e) => setCfgBlikPhone(e.target.value)}
                className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 tabular-nums focus:border-[#2196F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-[#334E68]">
                Twój rachunek bankowy (IBAN)
              </label>
              <input
                type="text"
                value={cfgBankAccount}
                onChange={(e) => setCfgBankAccount(e.target.value)}
                className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 tabular-nums focus:border-[#2196F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-[#334E68]">
                Resend API Key (e-maile z potwierdzeniem)
              </label>
              <input
                type="password"
                placeholder="re_..."
                value={cfgResendKey}
                onChange={(e) => setCfgResendKey(e.target.value)}
                className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 focus:border-[#2196F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-[#334E68]">
                SMSAPI Token (automatyczne SMS-y)
              </label>
              <input
                type="password"
                placeholder="Token SMSAPI"
                value={cfgSmsToken}
                onChange={(e) => setCfgSmsToken(e.target.value)}
                className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 focus:border-[#2196F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-[#334E68]">
                Opłata serwisowa START (zł)
              </label>
              <input
                type="number"
                step="0.1"
                min={0}
                value={cfgServiceFee}
                onChange={(e) => setCfgServiceFee(Number(e.target.value))}
                className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 tabular-nums focus:border-[#2196F3] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-medium text-[#334E68]">
                Cena abonamentu PRO (zł/mies.)
              </label>
              <input
                type="number"
                min={1}
                value={cfgProPrice}
                onChange={(e) => setCfgProPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 tabular-nums focus:border-[#2196F3] focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* SIMULATOR + COLD DM ENGINE */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden flex flex-col justify-between">
            <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5 flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-[#0A192F]">
                Symulator skali zarobków
              </h2>
              <span className="text-[11px] text-[#627D98] whitespace-nowrap shrink-0">
                25 dni/mies.
              </span>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#334E68]">Aktywne salony w Polsce</span>
                  <span className="font-bold tabular-nums text-[#0D47A1] whitespace-nowrap shrink-0">
                    {simStudios}
                  </span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={300}
                  step={5}
                  value={simStudios}
                  onChange={(e) => setSimStudios(Number(e.target.value))}
                  className="snipper-slider mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E3F2FD]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#334E68]">Zadatki dziennie / salon</span>
                  <span className="font-bold tabular-nums text-[#0D47A1] whitespace-nowrap shrink-0">
                    {simDailyBookings} / dzień
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={6}
                  step={1}
                  value={simDailyBookings}
                  onChange={(e) => setSimDailyBookings(Number(e.target.value))}
                  className="snipper-slider mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E3F2FD]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#334E68]">Udział planu PRO ({cfgProPrice} zł)</span>
                  <span className="font-bold tabular-nums text-[#0D47A1] whitespace-nowrap shrink-0">
                    {simProPercent}% ({proCount} PRO)
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={simProPercent}
                  onChange={(e) => setSimProPercent(Number(e.target.value))}
                  className="snipper-slider mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#E3F2FD]"
                />
              </div>
            </div>

            <div className="border-t border-[#0D47A1] bg-[#0D47A1] p-5 text-white space-y-2.5">
              <div className="flex justify-between text-xs text-[#90CAF9]">
                <span>Transakcje ({monthlyStartTx} × 2,50 zł)</span>
                <span className="text-white tabular-nums">
                  +{formatPLN(monthlyTxProfit)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#90CAF9]">
                <span>MRR ({proCount} × {cfgProPrice} zł)</span>
                <span className="text-white tabular-nums">+{formatPLN(monthlyMrr)}</span>
              </div>
              <div className="border-t border-white/15 pt-2.5 flex items-baseline justify-between">
                <span className="text-xs font-semibold text-[#E3F2FD]">
                  Czysty zysk / mies.
                </span>
                <span className="text-2xl font-bold tabular-nums text-white">
                  {formatPLN(monthlyTotalProfit)}
                </span>
              </div>
              <div className="text-right text-[11px] text-[#90CAF9] tabular-nums">
                rocznie: {formatPLN(yearlyTotalProfit)}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden">
            <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#0A192F]">
                  Kombajn Cold-DM (pozyskanie klientów za 0 zł)
                </h2>
                <p className="text-[11px] text-[#334E68]">
                  Wpisz znaleziony salon → wygeneruj mu live demo → skopiuj gotową wiadomość
                </p>
              </div>
              <span className="text-[11px] text-[#2196F3]">/s/{activeSlug}</span>
            </div>

            <div className="p-5 space-y-5">
              {demoError && (
                <div className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {demoError}
                </div>
              )}

              <form
                onSubmit={handleCreateDemoForProspect}
                className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4"
              >
                <input
                  type="text"
                  required
                  placeholder="Nazwa salonu"
                  value={prospectName}
                  onChange={(e) => setProspectName(e.target.value)}
                  className="rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs font-semibold focus:border-[#2196F3] focus:outline-none"
                />
                <select
                  value={prospectIndustry}
                  onChange={(e) => setProspectIndustry(e.target.value as IndustryType)}
                  className="rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs focus:border-[#2196F3] focus:outline-none"
                >
                  <option value="tattoo">Tatuaż & PMU</option>
                  <option value="detailing">Auto Detailing</option>
                  <option value="groomer">Groomer (Psy)</option>
                  <option value="other">Inne Usługi</option>
                </select>
                <input
                  type="text"
                  placeholder="Miasto"
                  value={prospectCity}
                  onChange={(e) => setProspectCity(e.target.value)}
                  className="rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs focus:border-[#2196F3] focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="@instagram"
                  value={prospectIg}
                  onChange={(e) => setProspectIg(e.target.value)}
                  className="rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs focus:border-[#2196F3] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={creatingDemo}
                  className="sm:col-span-2 lg:col-span-4 product-link !w-full disabled:opacity-60"
                >
                  {creatingDemo
                    ? 'Tworzę profil demo...'
                    : 'Utwórz gotowy profil demo dla tego salonu w bazie (1 klik)'}
                </button>
              </form>

              {createdDemoStudio && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-[5px] border border-[#90CAF9] bg-[#E3F2FD]/60 px-3.5 py-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D47A1]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2196F3]" />
                    Utworzono: /s/{createdDemoStudio.slug}
                  </span>
                  <Link
                    href={`/s/${createdDemoStudio.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 font-medium text-[#0D47A1] underline"
                  >
                    Otwórz profil <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              <div className="rounded-[6px] border border-[#90CAF9]/50 overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-3 py-2">
                  <div className="flex gap-1">
                    {(['ig', 'maps', 'followup'] as const).map((tabKey) => (
                      <button
                        key={tabKey}
                        type="button"
                        onClick={() => setActiveTemplateTab(tabKey)}
                        className={`rounded-[4px] px-2.5 py-1 text-[11px] font-medium transition-colors ${
                          activeTemplateTab === tabKey
                            ? 'bg-white text-[#0D47A1] border border-[#90CAF9] shadow-2xs font-semibold'
                            : 'text-[#334E68] hover:text-[#0D47A1]'
                        }`}
                      >
                        {templates[tabKey].label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => copyText(activeTemplate.text, activeTemplate.id)}
                    className="inline-flex items-center gap-1 rounded-[4px] border border-[#90CAF9] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0D47A1] hover:bg-[#E3F2FD]"
                  >
                    {copiedId === activeTemplate.id ? (
                      <>
                        <Check className="h-3 w-3 text-[#2196F3]" />
                        Skopiowano
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Kopiuj
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 bg-white space-y-2">
                  <p className="text-[11px] text-[#627D98]">{activeTemplate.hint}</p>
                  <p className="text-xs text-[#334E68] leading-relaxed select-all">
                    {activeTemplate.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STUDIOS + SUBSCRIPTION INVOICES */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-6 rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden">
            <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0A192F]">
                Zarejestrowane salony ({studios.length})
              </h3>
              <span className="text-[11px] text-[#627D98]">
                {initialBookings.length} rezerwacji w bazie
              </span>
            </div>
            <div className="divide-y divide-[#E3F2FD]">
              {studios.map((st) => {
                const cfg = getIndustryConfig(st.industry);
                return (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#F7FBFF]"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#0A192F]">
                          {st.name}
                        </span>
                        <span
                          className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-semibold ${
                            st.plan === 'PRO'
                              ? 'bg-[#0D47A1] text-white'
                              : 'border border-[#90CAF9] bg-[#E3F2FD]/60 text-[#0D47A1]'
                          }`}
                        >
                          {st.plan}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-[#334E68]">
                        {cfg.shortLabel} • {st.city} • {st.instagram}
                      </p>
                    </div>
                    <Link
                      href={`/s/${st.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-[#2196F3] hover:text-[#0D47A1]"
                    >
                      /s/{st.slug}
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-6 rounded-[10px] border border-[#90CAF9]/50 bg-white/95 overflow-hidden">
            <div className="border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45 px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0A192F]">
                Opłacone subskrypcje PRO ({subscriptions.length})
              </h3>
              <span className="text-[11px] text-[#627D98]">Faktury / Rachunki</span>
            </div>
            <div className="divide-y divide-[#E3F2FD]">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 text-xs"
                >
                  <div>
                    <p className="font-semibold text-[#0A192F]">
                      {sub.invoiceNumber} — {sub.companyName}
                    </p>
                    <p className="text-[11px] text-[#334E68]">
                      Salon: {sub.studioName} • NIP: {sub.nip}
                    </p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-bold text-[#0D47A1]">+{formatPLN(sub.amount)}</p>
                    <p className="text-[10px] text-[#627D98]">
                      {sub.createdAt.slice(0, 10)}
                    </p>
                  </div>
                </div>
              ))}
              {subscriptions.length === 0 && (
                <div className="p-6 text-center text-xs text-[#627D98]">
                  Brak opłaconych faktur PRO.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
