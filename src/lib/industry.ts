import type { IndustryType, ServiceItem } from './types';

export interface IndustryConfig {
  label: string;
  shortLabel: string;
  badgeColor: string;
  customFieldLabel: string;
  customFieldPlaceholder: string;
  notesPlaceholder: string;
  defaultServices: ServiceItem[];
  avgTicketExample: number;
}

export const INDUSTRY_CONFIGS: Record<IndustryType, IndustryConfig> = {
  tattoo: {
    label: 'Tatuaż & Piercing / PMU',
    shortLabel: 'Tatuaż & PMU',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    customFieldLabel: 'Miejsce na ciele i orientacyjny rozmiar (cm)',
    customFieldPlaceholder: 'np. Przedramię wewnętrzne, ok. 14x8 cm, styl fineline',
    notesPlaceholder: 'np. Krótki opis pomysłu lub link do inspiracji na IG',
    avgTicketExample: 800,
    defaultServices: [
      {
        id: 'tat-1',
        name: 'Mały tatuaż (do 10 cm)',
        description: 'Projekt autorski lub fineline, sesja 1.5–2h',
        totalPrice: 450,
        depositAmount: 150,
        durationMinutes: 120,
      },
      {
        id: 'tat-2',
        name: 'Średni projekt / Przedramię / Łydka',
        description: 'Sesja 3–4h, projekt przygotowywany indywidualnie',
        totalPrice: 1100,
        depositAmount: 250,
        durationMinutes: 240,
      },
      {
        id: 'tat-3',
        name: 'Sesja całodniowa (Full Day)',
        description: 'Duże kompozycje, rękaw, plecy (6–7h pracy)',
        totalPrice: 2200,
        depositAmount: 400,
        durationMinutes: 420,
      },
    ],
  },
  detailing: {
    label: 'Auto Detailing & PPF',
    shortLabel: 'Auto Detailing',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    customFieldLabel: 'Marka, model i gabaryt auta',
    customFieldPlaceholder: 'np. BMW Seria 3 (Sedan) / Audi Q5 (SUV)',
    notesPlaceholder: 'np. Stan lakieru, czy były wcześniej nakładane powłoki',
    avgTicketExample: 1400,
    defaultServices: [
      {
        id: 'det-1',
        name: 'Detailing wnętrza + pranie tapicerki',
        description: 'Czyszczenie parowe, impregnacja skór/tkanin, ozonowanie',
        totalPrice: 650,
        depositAmount: 150,
        durationMinutes: 240,
      },
      {
        id: 'det-2',
        name: 'Jednoetapowa korekta lakieru + wosk/ceramika',
        description: 'Usunięcie 60–70% rys i zabezpieczenie lakieru',
        totalPrice: 1600,
        depositAmount: 300,
        durationMinutes: 480,
      },
      {
        id: 'det-3',
        name: 'Folia ochronna PPF (Pakiet Full Front)',
        description: 'Zderzak, maska, błotniki, lampy i lusterka',
        totalPrice: 4500,
        depositAmount: 500,
        durationMinutes: 600,
      },
    ],
  },
  groomer: {
    label: 'Groomer / Salon dla Psów',
    shortLabel: 'Groomer',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    customFieldLabel: 'Imię, rasa i waga psa (kg)',
    customFieldPlaceholder: 'np. Burek, Maltipoo, 6 kg, brak kołtunów',
    notesPlaceholder: 'np. Wrażliwe uszy, pies pierwszy raz u groomera',
    avgTicketExample: 220,
    defaultServices: [
      {
        id: 'gro-1',
        name: 'Pakiet Pełny — Pies mały (do 10 kg)',
        description: 'Kąpiel, suszenie, strzyżenie, obcinanie pazurków i higiena uszu',
        totalPrice: 190,
        depositAmount: 50,
        durationMinutes: 90,
      },
      {
        id: 'gro-2',
        name: 'Pakiet Pełny — Pies średni (10–25 kg)',
        description: 'Kąpiel kosmetyczna, wyczesanie podszerstka, strzyżenie',
        totalPrice: 270,
        depositAmount: 70,
        durationMinutes: 120,
      },
      {
        id: 'gro-3',
        name: 'Wyczesywanie i trymowanie dużych ras (25+ kg)',
        description: 'Redukcja linienia do 80%, kąpiel regenerująca',
        totalPrice: 360,
        depositAmount: 100,
        durationMinutes: 150,
      },
    ],
  },
  other: {
    label: 'Inne Usługi Wysokomarżowe',
    shortLabel: 'Usługi Premium',
    badgeColor: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    customFieldLabel: 'Szczegóły zlecenia / typ usługi',
    customFieldPlaceholder: 'np. Konsultacja indywidualna / pakiet premium',
    notesPlaceholder: 'Dodatkowe informacje przed wizytą',
    avgTicketExample: 350,
    defaultServices: [
      {
        id: 'oth-1',
        name: 'Wizyta indywidualna / Konsultacja',
        description: 'Pełna usługa z indywidualnym przygotowaniem stanowiska',
        totalPrice: 350,
        depositAmount: 100,
        durationMinutes: 90,
      },
    ],
  },
};

export function getIndustryConfig(industry: IndustryType): IndustryConfig {
  return INDUSTRY_CONFIGS[industry] ?? INDUSTRY_CONFIGS.other;
}

export function formatPLN(value: number): string {
  return new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value) + ' zł';
}
