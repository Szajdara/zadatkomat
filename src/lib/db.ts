import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  Booking,
  BookingStatus,
  DatabaseState,
  IndustryType,
  PaymentMethodType,
  PlatformConfig,
  PlatformStats,
  ServiceItem,
  Studio,
  StudioPlan,
  SubscriptionPayment,
  WaitlistEntry,
} from './types';
import { getIndustryConfig } from './industry';
import { hashPassword, verifyPassword } from './auth';
import {
  isMaskedSecret,
  maskEmail,
  maskPhone,
  maskSecret,
  sanitizeText,
} from './security';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export const PLATFORM_SERVICE_FEE = 4.9;
export const STRIPE_BLIK_FEE_ESTIMATE = 2.4;
export const PLATFORM_NET_PROFIT_PER_TX = 2.5;
export const PRO_PLAN_PRICE_PLN = 49;

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 3600 * 1000).toISOString();
}

function minutesFromNowIso(minutes: number): string {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function defaultPlatformConfig(): PlatformConfig {
  return {
    stripeSecretKey: '',
    platformBlikPhone: '+48 500 000 000',
    platformBankAccount: 'PL 00 1020 0000 0000 0000 0000 0000',
    resendApiKey: '',
    smsApiToken: '',
    serviceFeePln: PLATFORM_SERVICE_FEE,
    proPlanPricePln: PRO_PLAN_PRICE_PLN,
  };
}

function createSeedDatabase(): DatabaseState {
  const demoPasswordHash = hashPassword('demo123');

  const studios: Studio[] = [
    {
      id: 'st-ink-soul',
      slug: 'ink-soul-tattoo',
      name: 'INK & SOUL Tattoo Studio',
      industry: 'tattoo',
      city: 'Warszawa',
      instagram: '@inksoul.warszawa',
      phone: '+48 512 340 890',
      blikPhone: '+48 512 340 890',
      bankAccount: 'PL 42 1020 1026 0000 1102 0234 5678',
      nip: '5250001122',
      ownerEmail: 'demo@ink-soul.pl',
      passwordHash: demoPasswordHash,
      isDemo: true,
      plan: 'START',
      cancelPolicyHours: 48,
      bio: 'Autorskie tatuaże fineline, micro-realizm i blackwork w centrum Warszawy. Termin potwierdza wyłącznie wpłata zadatku BLIK.',
      services: getIndustryConfig('tattoo').defaultServices,
      createdAt: hoursAgoIso(480),
    },
    {
      id: 'st-apex-detailing',
      slug: 'apex-detailing',
      name: 'APEX Auto Detailing & PPF',
      industry: 'detailing',
      city: 'Kraków',
      instagram: '@apex.detailing.krk',
      phone: '+48 604 912 221',
      blikPhone: '+48 604 912 221',
      bankAccount: 'PL 18 1140 2004 0000 3102 7654 3210',
      nip: '6762450091',
      proExpiresAt: addDaysIso(24),
      ownerEmail: 'demo@apex-detailing.pl',
      passwordHash: demoPasswordHash,
      isDemo: true,
      plan: 'PRO',
      cancelPolicyHours: 48,
      bio: 'Certyfikowane studio ochrony lakieru PPF, powłok ceramicznych i korekty lakieru. Zadbamy o Twoje auto na najwyższym poziomie.',
      services: getIndustryConfig('detailing').defaultServices,
      createdAt: hoursAgoIso(360),
    },
    {
      id: 'st-lapka-groomer',
      slug: 'lapka-groomer',
      name: 'Łapka & Styl Groomer SPA',
      industry: 'groomer',
      city: 'Wrocław',
      instagram: '@lapka.groomer.wro',
      phone: '+48 790 445 118',
      blikPhone: '+48 790 445 118',
      ownerEmail: 'demo@lapka-groomer.pl',
      passwordHash: demoPasswordHash,
      isDemo: true,
      plan: 'START',
      cancelPolicyHours: 24,
      bio: 'Bezstresowa pielęgnacja psów małych i średnich ras. Kosmetyki hipoalergiczne, 100% indywidualnego podejścia.',
      services: getIndustryConfig('groomer').defaultServices,
      createdAt: hoursAgoIso(240),
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'bk-101',
      shortCode: 'INK-8421',
      studioId: 'st-ink-soul',
      studioSlug: 'ink-soul-tattoo',
      studioName: 'INK & SOUL Tattoo Studio',
      serviceName: 'Średni projekt / Przedramię / Łydka',
      clientName: 'Kacper Nowak',
      clientPhone: '501 234 567',
      clientNotes: 'Wąż oplatający gałązkę oliwną, zdjęcie wysłane na IG DM.',
      customFieldLabel: 'Miejsce na ciele i orientacyjny rozmiar (cm)',
      customFieldValue: 'Lewe przedramię, ok. 16x7 cm, fineline',
      date: addDaysIso(2),
      time: '11:00',
      totalPrice: 1100,
      depositAmount: 250,
      serviceFee: 4.9,
      stripeFeeEstimate: 2.4,
      platformNetProfit: 2.5,
      status: 'PAID',
      source: 'IG_LINK',
      createdAt: hoursAgoIso(30),
      paidAt: hoursAgoIso(29),
      expiresAt: hoursAgoIso(29.75),
      paymentProvider: 'DEMO_BLIK',
      paymentMethod: 'BLIK_CODE',
    },
    {
      id: 'bk-102',
      shortCode: 'INK-9930',
      studioId: 'st-ink-soul',
      studioSlug: 'ink-soul-tattoo',
      studioName: 'INK & SOUL Tattoo Studio',
      serviceName: 'Mały tatuaż (do 10 cm)',
      clientName: 'Wiktoria Zielińska',
      clientPhone: '609 871 223',
      clientNotes: 'Napis minimalizm + mała jaskółka.',
      customFieldLabel: 'Miejsce na ciele i orientacyjny rozmiar (cm)',
      customFieldValue: 'Nadgarstek / obojczyk, ok. 6 cm',
      date: addDaysIso(3),
      time: '14:30',
      totalPrice: 450,
      depositAmount: 150,
      serviceFee: 4.9,
      stripeFeeEstimate: 2.4,
      platformNetProfit: 2.5,
      status: 'PENDING_PAYMENT',
      source: 'IG_LINK',
      createdAt: hoursAgoIso(0.1),
      expiresAt: minutesFromNowIso(14),
    },
    {
      id: 'bk-103',
      shortCode: 'LAP-5512',
      studioId: 'st-lapka-groomer',
      studioSlug: 'lapka-groomer',
      studioName: 'Łapka & Styl Groomer SPA',
      serviceName: 'Pakiet Pełny — Pies mały (do 10 kg)',
      clientName: 'Marta Kowalczyk',
      clientPhone: '518 332 901',
      clientNotes: 'Piesek trochę boi się suszarki, proszę o spokojne podejście.',
      customFieldLabel: 'Imię, rasa i waga psa (kg)',
      customFieldValue: 'Lulu, Cavapoo, 6.5 kg',
      date: addDaysIso(1),
      time: '10:00',
      totalPrice: 190,
      depositAmount: 50,
      serviceFee: 4.9,
      stripeFeeEstimate: 2.4,
      platformNetProfit: 2.5,
      status: 'PAID',
      source: 'PUBLIC_PROFILE',
      createdAt: hoursAgoIso(16),
      paidAt: hoursAgoIso(15.9),
      expiresAt: hoursAgoIso(15.75),
      paymentProvider: 'DEMO_BLIK',
      paymentMethod: 'BLIK_CODE',
    },
    {
      id: 'bk-104',
      shortCode: 'LAP-3310',
      studioId: 'st-lapka-groomer',
      studioSlug: 'lapka-groomer',
      studioName: 'Łapka & Styl Groomer SPA',
      serviceName: 'Pakiet Pełny — Pies średni (10–25 kg)',
      clientName: 'Tomasz Wiśniewski',
      clientPhone: '660 112 409',
      clientNotes: 'Odwołane 5 godzin przed wizytą — zadatek zatrzymany wg regulaminu.',
      customFieldLabel: 'Imię, rasa i waga psa (kg)',
      customFieldValue: 'Borys, Cocker Spaniel, 14 kg',
      date: addDaysIso(-1),
      time: '12:00',
      totalPrice: 270,
      depositAmount: 70,
      serviceFee: 4.9,
      stripeFeeEstimate: 2.4,
      platformNetProfit: 2.5,
      status: 'CANCELLED_FORFEITED',
      source: 'PUBLIC_PROFILE',
      createdAt: hoursAgoIso(72),
      paidAt: hoursAgoIso(71),
      expiresAt: hoursAgoIso(71.75),
      paymentProvider: 'DEMO_BLIK',
      paymentMethod: 'BLIK_CODE',
    },
    {
      id: 'bk-105',
      shortCode: 'APX-7741',
      studioId: 'st-apex-detailing',
      studioSlug: 'apex-detailing',
      studioName: 'APEX Auto Detailing & PPF',
      serviceName: 'Jednoetapowa korekta lakieru + wosk/ceramika',
      clientName: 'Michał Lewandowski',
      clientPhone: '505 889 104',
      clientNotes: 'Auto po myjniach automatycznych, widoczne swirle w słońcu.',
      customFieldLabel: 'Marka, model i gabaryt auta',
      customFieldValue: 'Porsche Macan S (SUV), czarny metallic',
      date: addDaysIso(2),
      time: '09:00',
      totalPrice: 1600,
      depositAmount: 300,
      serviceFee: 0,
      stripeFeeEstimate: 0,
      platformNetProfit: 0,
      status: 'PAID',
      source: 'IG_LINK',
      createdAt: hoursAgoIso(40),
      paidAt: hoursAgoIso(39.8),
      expiresAt: hoursAgoIso(39.75),
      paymentProvider: 'DEMO_BLIK',
      paymentMethod: 'BLIK_CODE',
    },
    {
      id: 'bk-106',
      shortCode: 'INK-4190',
      studioId: 'st-ink-soul',
      studioSlug: 'ink-soul-tattoo',
      studioName: 'INK & SOUL Tattoo Studio',
      serviceName: 'Sesja całodniowa (Full Day)',
      clientName: 'Aleksandra Dąbrowska',
      clientPhone: '721 554 098',
      clientNotes: 'Kwiatowy rękaw, część górna — druga sesja.',
      customFieldLabel: 'Miejsce na ciele i orientacyjny rozmiar (cm)',
      customFieldValue: 'Ramię + bark, 28x15 cm',
      date: addDaysIso(-2),
      time: '10:00',
      totalPrice: 2200,
      depositAmount: 400,
      serviceFee: 4.9,
      stripeFeeEstimate: 2.4,
      platformNetProfit: 2.5,
      status: 'COMPLETED',
      source: 'IG_LINK',
      createdAt: hoursAgoIso(120),
      paidAt: hoursAgoIso(119.5),
      expiresAt: hoursAgoIso(119.75),
      paymentProvider: 'DEMO_BLIK',
      paymentMethod: 'BLIK_CODE',
    },
  ];

  const waitlist: WaitlistEntry[] = [
    {
      id: 'wl-1',
      studioId: 'st-ink-soul',
      studioSlug: 'ink-soul-tattoo',
      clientName: 'Julia Krawczyk',
      clientPhone: '509 441 820',
      preferredService: 'Mały tatuaż (do 10 cm)',
      preferredDays: 'Piątki lub soboty (pilne!)',
      notified: false,
      createdAt: hoursAgoIso(12),
    },
    {
      id: 'wl-2',
      studioId: 'st-ink-soul',
      studioSlug: 'ink-soul-tattoo',
      clientName: 'Bartosz Mazur',
      clientPhone: '602 198 732',
      preferredService: 'Średni projekt / Przedramię / Łydka',
      preferredDays: 'Dowolny dzień w tym tygodniu po 13:00',
      notified: false,
      createdAt: hoursAgoIso(6),
    },
    {
      id: 'wl-3',
      studioId: 'st-lapka-groomer',
      studioSlug: 'lapka-groomer',
      clientName: 'Karolina Szymańska',
      clientPhone: '733 901 452',
      preferredService: 'Pakiet Pełny — Pies mały (do 10 kg)',
      preferredDays: 'Każde wolne okienko rano',
      notified: false,
      createdAt: hoursAgoIso(4),
    },
  ];

  const subscriptions: SubscriptionPayment[] = [
    {
      id: 'sub-101',
      studioId: 'st-apex-detailing',
      studioName: 'APEX Auto Detailing & PPF',
      nip: '6762450091',
      companyName: 'APEX Detailing Sp. z o.o.',
      amount: 49,
      blikCodeLast2: '19',
      invoiceNumber: 'FV/2026/11/001',
      createdAt: hoursAgoIso(120),
    },
  ];

  return {
    studios,
    bookings,
    waitlist,
    subscriptions,
    config: defaultPlatformConfig(),
  };
}

function normalizeDatabase(rawDb: DatabaseState): DatabaseState {
  let dirty = false;
  const demoSlugs = new Set(['ink-soul-tattoo', 'apex-detailing', 'lapka-groomer']);
  const studios = rawDb.studios.map((st) => {
    const next = { ...st };
    if (!next.ownerEmail) {
      next.ownerEmail = `demo@${next.slug}.pl`;
      dirty = true;
    }
    if (!next.passwordHash) {
      next.passwordHash = hashPassword('demo123');
      dirty = true;
    }
    if (next.isDemo === undefined && demoSlugs.has(next.slug)) {
      next.isDemo = true;
      dirty = true;
    }
    if (!next.blikPhone && next.phone) {
      next.blikPhone = next.phone;
      dirty = true;
    }
    return next;
  });

  const subscriptions = Array.isArray(rawDb.subscriptions) ? rawDb.subscriptions : [];
  if (!Array.isArray(rawDb.subscriptions)) dirty = true;

  const config: PlatformConfig = {
    ...defaultPlatformConfig(),
    ...(rawDb.config || {}),
  };
  if (!rawDb.config) dirty = true;

  const normalized: DatabaseState = {
    ...rawDb,
    studios,
    subscriptions,
    config,
  };
  if (dirty) {
    saveDb(normalized);
  }
  return normalized;
}

export function getDb(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseState;
    if (!parsed.studios || !parsed.bookings || !parsed.waitlist) {
      throw new Error('Malformed db.json');
    }
    return normalizeDatabase(parsed);
  } catch {
    const seed = createSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

export function saveDb(state: DatabaseState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const tmpFile = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmpFile, DB_FILE);
}

export function toSafeStudio(studio: Studio): Studio {
  const safe = { ...studio };
  delete safe.passwordHash;
  return safe;
}

export function toPublicBooking(booking: Booking): Booking {
  return {
    ...booking,
    clientPhone: maskPhone(booking.clientPhone),
    clientEmail: maskEmail(booking.clientEmail),
  };
}

export function toSafePlatformConfig(config: PlatformConfig): PlatformConfig {
  return {
    ...config,
    stripeSecretKey: maskSecret(config.stripeSecretKey),
    resendApiKey: maskSecret(config.resendApiKey),
    smsApiToken: maskSecret(config.smsApiToken),
  };
}

export function slugify(input: string): string {
  const plMap: Record<string, string> = {
    ą: 'a',
    ć: 'c',
    ę: 'e',
    ł: 'l',
    ń: 'n',
    ó: 'o',
    ś: 's',
    ź: 'z',
    ż: 'z',
  };
  return input
    .toLowerCase()
    .split('')
    .map((ch) => plMap[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

const CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateShortCode(studioName: string, existingCodes: Set<string>): string {
  const prefix = slugify(studioName).replace(/-/g, '').slice(0, 3).toUpperCase() || 'ZAD';
  for (let attempt = 0; attempt < 20; attempt++) {
    const bytes = crypto.randomBytes(6);
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    const code = `${prefix}-${suffix}`;
    if (!existingCodes.has(code)) {
      return code;
    }
  }
  return `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function getEffectiveStripeSecret(db?: DatabaseState): string {
  const state = db ?? getDb();
  return (
    process.env.STRIPE_SECRET_KEY?.trim() ||
    state.config?.stripeSecretKey?.trim() ||
    ''
  );
}

export function getStudioBySlug(slug: string): Studio | undefined {
  const db = getDb();
  return db.studios.find((s) => s.slug === slug);
}

export function getStudioById(studioId: string): Studio | undefined {
  const db = getDb();
  return db.studios.find((s) => s.id === studioId);
}

export function authenticateStudio(emailOrSlug: string, password: string): Studio | null {
  const db = getDb();
  const normalized = emailOrSlug.trim().toLowerCase();
  const studio = db.studios.find(
    (s) =>
      s.ownerEmail.toLowerCase() === normalized ||
      s.slug.toLowerCase() === normalized
  );
  if (!studio) return null;
  if (!verifyPassword(password, studio.passwordHash)) return null;
  return studio;
}

export function getBookingByCode(code: string): { booking: Booking; studio?: Studio } | undefined {
  const db = getDb();
  const normalized = code.trim().toUpperCase();
  const booking = db.bookings.find(
    (b) => b.shortCode.toUpperCase() === normalized || b.id === code
  );
  if (!booking) return undefined;
  const studio = db.studios.find((s) => s.id === booking.studioId);
  return { booking, studio: studio ? toSafeStudio(studio) : undefined };
}

export function isSlotOccupied(booking: Booking, nowMs = Date.now()): boolean {
  if (booking.status === 'PAID') return true;
  if (booking.status === 'PENDING_PAYMENT') {
    const expMs = new Date(booking.expiresAt).getTime();
    return Number.isFinite(expMs) && expMs > nowMs;
  }
  return false;
}

export function searchPublicStudiosAndBooking(query: string) {
  const db = getDb();
  const q = sanitizeText(query, 64).toLowerCase();

  const studios = db.studios
    .filter((s) => {
      if (!q) return true;
      const indLabel = getIndustryConfig(s.industry).label.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        indLabel.includes(q)
      );
    })
    .slice(0, 6)
    .map((s) => ({
      slug: s.slug,
      name: s.name,
      city: s.city,
      industryLabel: getIndustryConfig(s.industry).shortLabel,
      instagram: s.instagram,
    }));

  const normalizedCode = sanitizeText(query, 24).toUpperCase();
  const matchedBooking = normalizedCode
    ? db.bookings.find((b) => b.shortCode.toUpperCase() === normalizedCode)
    : undefined;

  return {
    studios,
    booking: matchedBooking
      ? {
          shortCode: matchedBooking.shortCode,
          studioName: matchedBooking.studioName,
          serviceName: matchedBooking.serviceName,
          date: matchedBooking.date,
          time: matchedBooking.time,
          status: matchedBooking.status,
        }
      : null,
  };
}

export interface CreateBookingInput {
  studioId: string;
  serviceId?: string;
  serviceName: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  clientNotes?: string;
  customFieldLabel?: string;
  customFieldValue?: string;
  date: string;
  time: string;
  totalPrice: number;
  depositAmount: number;
  source?: 'IG_LINK' | 'PUBLIC_PROFILE';
}

export function createBooking(input: CreateBookingInput): Booking {
  const db = getDb();
  const studio = db.studios.find((s) => s.id === input.studioId);
  if (!studio) {
    throw new Error('Nie znaleziono wybranego studia/salonu.');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !/^\d{2}:\d{2}$/.test(input.time)) {
    throw new Error('Nieprawidłowy format daty lub godziny.');
  }

  const safeSource = input.source ?? 'PUBLIC_PROFILE';
  let resolvedServiceName = sanitizeText(input.serviceName, 120);
  let resolvedTotalPrice = Number(input.totalPrice);
  let resolvedDepositAmount = Number(input.depositAmount);

  if (safeSource === 'PUBLIC_PROFILE') {
    const matchedService = studio.services.find(
      (srv) =>
        (input.serviceId && srv.id === input.serviceId) ||
        srv.name.trim().toLowerCase() === resolvedServiceName.toLowerCase()
    );
    if (!matchedService) {
      throw new Error('Wybrana usługa nie znajduje się w cenniku tego salonu.');
    }
    resolvedServiceName = matchedService.name;
    resolvedTotalPrice = matchedService.totalPrice;
    resolvedDepositAmount = matchedService.depositAmount;

    const nowMs = Date.now();
    const conflict = db.bookings.find(
      (b) =>
        b.studioId === studio.id &&
        b.date === input.date &&
        b.time === input.time &&
        isSlotOccupied(b, nowMs)
    );
    if (conflict) {
      throw new BookingConflictError(
        'Ten termin został przed chwilą zarezerwowany przez innego klienta. Wybierz inną godzinę.'
      );
    }
  } else {
    if (
      !Number.isFinite(resolvedDepositAmount) ||
      resolvedDepositAmount < 10 ||
      !Number.isFinite(resolvedTotalPrice) ||
      resolvedTotalPrice < resolvedDepositAmount
    ) {
      throw new Error('Nieprawidłowa kwota wyceny lub zadatku.');
    }
  }

  const existingCodes = new Set(db.bookings.map((b) => b.shortCode));
  const shortCode = generateShortCode(studio.name, existingCodes);
  const config = getIndustryConfig(studio.industry);

  const configuredFee = db.config?.serviceFeePln ?? PLATFORM_SERVICE_FEE;
  const hasPlatformFee = studio.plan === 'START';
  const serviceFee = hasPlatformFee ? configuredFee : 0;
  const stripeFeeEstimate = hasPlatformFee ? STRIPE_BLIK_FEE_ESTIMATE : 0;
  const platformNetProfit = hasPlatformFee
    ? Number(Math.max(0, configuredFee - STRIPE_BLIK_FEE_ESTIMATE).toFixed(2))
    : 0;

  const cleanEmail = sanitizeText(input.clientEmail ?? '', 120);

  const newBooking: Booking = {
    id: `bk-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    shortCode,
    studioId: studio.id,
    studioSlug: studio.slug,
    studioName: studio.name,
    serviceName: resolvedServiceName,
    clientName: sanitizeText(input.clientName, 80),
    clientPhone: sanitizeText(input.clientPhone, 25),
    clientEmail: cleanEmail || undefined,
    clientNotes: sanitizeText(input.clientNotes ?? '', 300),
    customFieldLabel: sanitizeText(input.customFieldLabel || config.customFieldLabel, 100),
    customFieldValue: sanitizeText(input.customFieldValue ?? '', 200) || 'Brak dodatkowych uwag',
    date: input.date,
    time: input.time,
    totalPrice: resolvedTotalPrice,
    depositAmount: resolvedDepositAmount,
    serviceFee,
    stripeFeeEstimate,
    platformNetProfit,
    status: 'PENDING_PAYMENT',
    source: safeSource,
    createdAt: new Date().toISOString(),
    expiresAt: minutesFromNowIso(15),
  };

  db.bookings.unshift(newBooking);
  saveDb(db);
  return newBooking;
}

export function declarePhoneTransfer(
  bookingIdOrCode: string,
  clientEmail?: string
): Booking {
  const db = getDb();
  const normalized = bookingIdOrCode.trim().toUpperCase();
  const idx = db.bookings.findIndex(
    (b) => b.id === bookingIdOrCode || b.shortCode.toUpperCase() === normalized
  );
  if (idx === -1) {
    throw new Error('Nie znaleziono rezerwacji.');
  }

  const current = db.bookings[idx];
  const cleanEmail = sanitizeText(clientEmail ?? '', 120);
  const updated: Booking = {
    ...current,
    paymentMethod: 'BLIK_PHONE_TRANSFER',
    transferDeclared: true,
    clientEmail: cleanEmail || current.clientEmail,
  };
  db.bookings[idx] = updated;
  saveDb(db);
  return updated;
}

export function markBookingPaid(
  bookingIdOrCode: string,
  provider: 'DEMO_BLIK' | 'STRIPE_BLIK' | 'PHONE_BLIK' = 'DEMO_BLIK',
  stripeSessionId?: string,
  options?: { clientEmail?: string; paymentMethod?: PaymentMethodType }
): Booking {
  const db = getDb();
  const normalized = bookingIdOrCode.trim().toUpperCase();
  const idx = db.bookings.findIndex(
    (b) => b.id === bookingIdOrCode || b.shortCode.toUpperCase() === normalized
  );
  if (idx === -1) {
    throw new Error('Nie znaleziono rezerwacji.');
  }

  const current = db.bookings[idx];
  if (current.status === 'PAID' || current.status === 'COMPLETED') {
    return current;
  }

  const cleanEmail = sanitizeText(options?.clientEmail ?? '', 120);
  const updated: Booking = {
    ...current,
    status: 'PAID',
    paidAt: new Date().toISOString(),
    paymentProvider: provider,
    paymentMethod: options?.paymentMethod ?? current.paymentMethod ?? 'BLIK_CODE',
    transferDeclared: false,
    clientEmail: cleanEmail || current.clientEmail,
    stripeSessionId: stripeSessionId ?? current.stripeSessionId,
  };

  db.bookings[idx] = updated;
  saveDb(db);
  return updated;
}

export function updateBookingStatus(bookingId: string, status: BookingStatus): Booking {
  const db = getDb();
  const idx = db.bookings.findIndex((b) => b.id === bookingId || b.shortCode === bookingId);
  if (idx === -1) {
    throw new Error('Nie znaleziono rezerwacji.');
  }

  const updated: Booking = {
    ...db.bookings[idx],
    status,
    cancelRequested: false,
    transferDeclared: false,
  };
  if (status === 'PAID' && !updated.paidAt) {
    updated.paidAt = new Date().toISOString();
    updated.paymentProvider = updated.paymentProvider ?? 'DEMO_BLIK';
  }
  db.bookings[idx] = updated;
  saveDb(db);
  return updated;
}

export function deleteBooking(bookingId: string): boolean {
  const db = getDb();
  const before = db.bookings.length;
  db.bookings = db.bookings.filter((b) => b.id !== bookingId && b.shortCode !== bookingId);
  if (db.bookings.length === before) {
    return false;
  }
  saveDb(db);
  return true;
}

export function requestBookingCancellation(
  bookingId: string,
  reason: string
): { action: 'DELETED_UNPAID' | 'REQUESTED'; booking?: Booking } {
  const db = getDb();
  const idx = db.bookings.findIndex((b) => b.id === bookingId || b.shortCode === bookingId);
  if (idx === -1) {
    throw new Error('Nie znaleziono rezerwacji.');
  }

  const current = db.bookings[idx];
  if (current.status === 'PENDING_PAYMENT') {
    db.bookings.splice(idx, 1);
    saveDb(db);
    return { action: 'DELETED_UNPAID' };
  }

  const updated: Booking = {
    ...current,
    cancelRequested: true,
    cancelReason: sanitizeText(reason, 240) || 'Prośba klienta o kontakt / zmianę terminu.',
  };
  db.bookings[idx] = updated;
  saveDb(db);
  return { action: 'REQUESTED', booking: updated };
}

export interface CreateStudioInput {
  name: string;
  industry: IndustryType;
  city: string;
  instagram: string;
  phone: string;
  ownerEmail?: string;
  password?: string;
  isDemo?: boolean;
  plan?: StudioPlan;
  cancelPolicyHours?: number;
  bio?: string;
}

export function createStudio(input: CreateStudioInput): Studio {
  const db = getDb();
  const emailNorm = sanitizeText(input.ownerEmail ?? '', 120).toLowerCase();
  if (emailNorm && db.studios.some((s) => s.ownerEmail.toLowerCase() === emailNorm)) {
    throw new Error('Konto z tym adresem e-mail już istnieje. Zaloguj się.');
  }

  const cleanName = sanitizeText(input.name, 80);
  const baseSlug = slugify(cleanName) || `studio-${Date.now()}`;
  let slug = baseSlug;
  let counter = 2;
  while (db.studios.some((s) => s.slug === slug)) {
    slug = `${baseSlug}-${counter++}`;
  }

  const config = getIndustryConfig(input.industry);
  const cleanCity = sanitizeText(input.city || 'Polska', 50);
  const cleanPhone = sanitizeText(input.phone || '+48 500 000 000', 25);

  const newStudio: Studio = {
    id: `st-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    slug,
    name: cleanName,
    industry: input.industry,
    city: cleanCity,
    instagram: sanitizeText(input.instagram || `@${slug}`, 60),
    phone: cleanPhone,
    blikPhone: cleanPhone,
    ownerEmail: emailNorm || `kontakt@${slug}.pl`,
    passwordHash: hashPassword(input.password || crypto.randomBytes(16).toString('hex')),
    isDemo: input.isDemo ?? false,
    plan: input.plan ?? 'START',
    cancelPolicyHours: input.cancelPolicyHours ?? 48,
    bio:
      sanitizeText(input.bio ?? '', 300) ||
      `${cleanName} (${cleanCity}) — szybka rezerwacja wizyt z bezpiecznym zadatkiem BLIK.`,
    services: config.defaultServices.map((srv, idx) => ({
      ...srv,
      id: `${slug}-srv-${idx + 1}`,
    })),
    createdAt: new Date().toISOString(),
  };

  db.studios.push(newStudio);
  saveDb(db);
  return newStudio;
}

export interface UpdateStudioSettingsInput {
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
}

export function updateStudioSettings(
  studioId: string,
  updates: UpdateStudioSettingsInput
): Studio {
  const db = getDb();
  const idx = db.studios.findIndex((s) => s.id === studioId);
  if (idx === -1) {
    throw new Error('Nie znaleziono studia.');
  }

  const current = db.studios[idx];
  let validatedServices = current.services;
  if (Array.isArray(updates.services)) {
    if (updates.services.length === 0) {
      throw new Error('Studio musi posiadać przynajmniej jedną usługę w cenniku.');
    }
    validatedServices = updates.services.map((srv, i) => {
      const name = sanitizeText(srv.name || '', 100);
      const totalPrice = Number(srv.totalPrice);
      const depositAmount = Number(srv.depositAmount);
      const durationMinutes = Number(srv.durationMinutes || 60);
      if (!name) throw new Error('Każda usługa musi mieć nazwę.');
      if (!Number.isFinite(totalPrice) || totalPrice < 20) {
        throw new Error(`Usługa „${name}”: cena całkowita musi wynosić min. 20 zł.`);
      }
      if (!Number.isFinite(depositAmount) || depositAmount < 10 || depositAmount > totalPrice) {
        throw new Error(
          `Usługa „${name}”: zadatek musi mieścić się między 10 zł a ceną całkowitą.`
        );
      }
      return {
        id: sanitizeText(srv.id || `${current.slug}-srv-${Date.now()}-${i}`, 60),
        name,
        description: sanitizeText(srv.description || '', 220),
        totalPrice,
        depositAmount,
        durationMinutes: Math.max(15, durationMinutes),
      };
    });
  }

  const updated: Studio = {
    ...current,
    name: updates.name ? sanitizeText(updates.name, 80) : current.name,
    city: updates.city ? sanitizeText(updates.city, 50) : current.city,
    instagram:
      updates.instagram !== undefined
        ? sanitizeText(updates.instagram, 60)
        : current.instagram,
    phone: updates.phone !== undefined ? sanitizeText(updates.phone, 25) : current.phone,
    blikPhone:
      updates.blikPhone !== undefined
        ? sanitizeText(updates.blikPhone, 25)
        : current.blikPhone,
    bankAccount:
      updates.bankAccount !== undefined
        ? sanitizeText(updates.bankAccount, 40)
        : current.bankAccount,
    nip: updates.nip !== undefined ? sanitizeText(updates.nip, 20) : current.nip,
    bio: updates.bio !== undefined ? sanitizeText(updates.bio, 300) : current.bio,
    cancelPolicyHours:
      updates.cancelPolicyHours !== undefined
        ? Math.max(1, Math.min(168, Number(updates.cancelPolicyHours)))
        : current.cancelPolicyHours,
    services: validatedServices,
  };

  db.studios[idx] = updated;
  saveDb(db);
  return updated;
}

export function updateStudioPlan(studioId: string, plan: StudioPlan): Studio {
  const db = getDb();
  const idx = db.studios.findIndex((s) => s.id === studioId || s.slug === studioId);
  if (idx === -1) {
    throw new Error('Nie znaleziono studia.');
  }
  db.studios[idx] = {
    ...db.studios[idx],
    plan,
  };
  saveDb(db);
  return db.studios[idx];
}

export function subscribeStudioToPro(
  studioId: string,
  input: { nip?: string; companyName: string; blikCode: string }
): { studio: Studio; payment: SubscriptionPayment } {
  const db = getDb();
  const idx = db.studios.findIndex((s) => s.id === studioId);
  if (idx === -1) {
    throw new Error('Nie znaleziono studia.');
  }

  const cleanCode = input.blikCode.replace(/\D/g, '');
  if (cleanCode.length !== 6) {
    throw new Error('Wpisz poprawny 6-cyfrowy kod BLIK.');
  }

  const companyName = sanitizeText(input.companyName || db.studios[idx].name, 100);
  const nip =
    sanitizeText(input.nip || db.studios[idx].nip || 'Brak (osoba fizyczna)', 25);
  const now = new Date();
  const ym = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;
  const seq = String((db.subscriptions?.length ?? 0) + 1).padStart(3, '0');
  const amount = db.config?.proPlanPricePln ?? PRO_PLAN_PRICE_PLN;

  const payment: SubscriptionPayment = {
    id: `sub-${Date.now()}`,
    studioId,
    studioName: db.studios[idx].name,
    nip,
    companyName,
    amount,
    blikCodeLast2: cleanCode.slice(-2),
    invoiceNumber: `FV/${ym}/${seq}`,
    createdAt: now.toISOString(),
  };

  db.studios[idx] = {
    ...db.studios[idx],
    plan: 'PRO',
    nip: nip !== 'Brak (osoba fizyczna)' ? nip : db.studios[idx].nip,
    proExpiresAt: addDaysIso(30),
  };
  db.subscriptions.unshift(payment);
  saveDb(db);

  return { studio: db.studios[idx], payment };
}

export function updatePlatformConfig(updates: Partial<PlatformConfig>): PlatformConfig {
  const db = getDb();
  const current = db.config ?? defaultPlatformConfig();

  const resolveSecret = (incoming: string | undefined, existing: string | undefined) => {
    if (incoming === undefined) return existing;
    if (isMaskedSecret(incoming)) return existing;
    return incoming.trim();
  };

  const next: PlatformConfig = {
    ...current,
    platformBlikPhone:
      updates.platformBlikPhone !== undefined
        ? sanitizeText(updates.platformBlikPhone, 25)
        : current.platformBlikPhone,
    platformBankAccount:
      updates.platformBankAccount !== undefined
        ? sanitizeText(updates.platformBankAccount, 40)
        : current.platformBankAccount,
    stripeSecretKey: resolveSecret(updates.stripeSecretKey, current.stripeSecretKey),
    resendApiKey: resolveSecret(updates.resendApiKey, current.resendApiKey),
    smsApiToken: resolveSecret(updates.smsApiToken, current.smsApiToken),
    serviceFeePln:
      updates.serviceFeePln !== undefined && Number.isFinite(Number(updates.serviceFeePln))
        ? Math.max(0, Number(updates.serviceFeePln))
        : current.serviceFeePln,
    proPlanPricePln:
      updates.proPlanPricePln !== undefined && Number.isFinite(Number(updates.proPlanPricePln))
        ? Math.max(1, Number(updates.proPlanPricePln))
        : current.proPlanPricePln,
  };
  db.config = next;
  saveDb(db);
  return next;
}

export interface AddWaitlistInput {
  studioId: string;
  clientName: string;
  clientPhone: string;
  preferredService: string;
  preferredDays: string;
}

export function addWaitlistEntry(input: AddWaitlistInput): WaitlistEntry {
  const db = getDb();
  const studio = db.studios.find((s) => s.id === input.studioId || s.slug === input.studioId);
  if (!studio) {
    throw new Error('Nie znaleziono studia.');
  }

  const entry: WaitlistEntry = {
    id: `wl-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    studioId: studio.id,
    studioSlug: studio.slug,
    clientName: sanitizeText(input.clientName, 80),
    clientPhone: sanitizeText(input.clientPhone, 25),
    preferredService: sanitizeText(input.preferredService || 'Dowolna usługa', 100),
    preferredDays: sanitizeText(input.preferredDays || 'Najbliższy wolny termin', 100),
    notified: false,
    createdAt: new Date().toISOString(),
  };

  db.waitlist.unshift(entry);
  saveDb(db);
  return entry;
}

export function notifyWaitlist(studioId: string): WaitlistEntry[] {
  const db = getDb();
  const now = new Date().toISOString();
  const notifiedEntries: WaitlistEntry[] = [];

  db.waitlist = db.waitlist.map((entry) => {
    if (entry.studioId === studioId && !entry.notified) {
      const updated = { ...entry, notified: true, notifiedAt: now };
      notifiedEntries.push(updated);
      return updated;
    }
    return entry;
  });

  saveDb(db);
  return notifiedEntries;
}

export function computePlatformStats(db: DatabaseState): PlatformStats {
  const startStudios = db.studios.filter((s) => s.plan === 'START').length;
  const proStudios = db.studios.filter((s) => s.plan === 'PRO').length;

  const realizedStatuses: BookingStatus[] = ['PAID', 'COMPLETED', 'CANCELLED_FORFEITED'];
  const realizedBookings = db.bookings.filter(
    (b) => realizedStatuses.includes(b.status) || Boolean(b.paidAt)
  );

  const paidWithFeeCount = realizedBookings.filter((b) => b.serviceFee > 0).length;
  const totalDepositsProcessed = realizedBookings.reduce((sum, b) => sum + b.depositAmount, 0);
  const totalServiceFeesCollected = Number(
    realizedBookings.reduce((sum, b) => sum + b.serviceFee, 0).toFixed(2)
  );
  const totalStripeFeesEstimate = Number(
    realizedBookings.reduce((sum, b) => sum + b.stripeFeeEstimate, 0).toFixed(2)
  );
  const totalTransactionNetProfit = Number(
    realizedBookings.reduce((sum, b) => sum + b.platformNetProfit, 0).toFixed(2)
  );
  const proPrice = db.config?.proPlanPricePln ?? PRO_PLAN_PRICE_PLN;
  const monthlyMrrRevenue = proStudios * proPrice;
  const totalPlatformRevenue = Number(
    (totalTransactionNetProfit + monthlyMrrRevenue).toFixed(2)
  );

  return {
    totalStudios: db.studios.length,
    startStudios,
    proStudios,
    totalBookings: db.bookings.length,
    paidBookingsCount: realizedBookings.length,
    paidWithFeeCount,
    pendingBookingsCount: db.bookings.filter((b) => b.status === 'PENDING_PAYMENT').length,
    forfeitedBookingsCount: db.bookings.filter((b) => b.status === 'CANCELLED_FORFEITED').length,
    totalDepositsProcessed,
    totalServiceFeesCollected,
    totalStripeFeesEstimate,
    totalTransactionNetProfit,
    monthlyMrrRevenue,
    totalPlatformRevenue,
  };
}
