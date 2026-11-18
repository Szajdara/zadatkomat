import Link from 'next/link';
import { Check } from 'lucide-react';
import { NoShowCalculator } from '@/components/NoShowCalculator';

export default function HomePage() {
  const niches = [
    {
      tag: 'Tatuaż & PMU',
      title: 'Studia Tatuażu & Piercingu',
      slug: 'ink-soul-tattoo',
      ticket: '800 – 2 200 zł / sesja',
      desc: 'Wyceniasz wzór w DM na Instagramie? Wyślij link zadatku z rozmiarem i miejscem. Klient ma 15 min na BLIK, inaczej termin wraca do grafiku.',
    },
    {
      tag: 'Auto Detailing',
      title: 'Auto Detailing, PPF & Serwis',
      slug: 'apex-detailing',
      ticket: '1 200 – 3 500 zł / dzień',
      desc: 'Klient wybiera model i gabaryt auta (Sedan / SUV) oraz wpłaca 150–500 zł zadatku BLIK. Hala nigdy więcej nie stoi pusta przez nieobecność.',
    },
    {
      tag: 'Groomer SPA',
      title: 'Salony Pielęgnacji Psów',
      slug: 'lapka-groomer',
      ticket: '190 – 360 zł / wizyta',
      desc: 'Rezerwacja zbiera rasę i wagę psa oraz pobiera 50–100 zł zadatku BLIK. Automatyczna Lista Rezerwowa łata odwołane okienka w kilka minut.',
    },
  ];

  return (
    <div className="w-full flex flex-col">
      {/* SECTION 1: ICE-BLUE GRADIENT HERO + SHOWCASE WINDOW */}
      <section className="snipper-hero-bg w-full flex justify-center">
        <div className="w-[90%] md:w-[80%] max-w-6xl pt-14 sm:pt-20 flex flex-col items-center text-center">
          <h1 className="text-3xl sm:text-[42px] sm:leading-[48px] font-bold text-[#0A192F] max-w-2xl">
            Koniec z klientami, którzy nie przychodzą na wizytę.
          </h1>

          <p className="mt-4 text-[15px] sm:text-base font-medium leading-6 text-[#334E68] max-w-xl">
            Z Zadatkomatem utworzysz gotowy link zadatku BLIK w kilka sekund — wyślij go
            na Instagramie lub dodaj do bio i zabezpiecz swój grafik za 0 zł abonamentu.
          </p>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Link href="/panel?mode=register" className="product-link">
              Załóż darmowe konto
            </Link>
            <p className="text-xs font-medium text-[#334E68]">
              Bez karty płatniczej. Zero prowizji od wartości Twoich usług.
            </p>
          </div>

          {/* Sapphire-Navy App Showcase Window */}
          <div className="mt-12 w-full max-w-4xl rounded-t-xl bg-[#0A192F] text-white shadow-2xl shadow-[#0D47A1]/20 border border-b-0 border-[#0D47A1]/40 overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-[#071324]">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#90CAF9]/40" />
                <span className="h-3 w-3 rounded-full bg-[#2196F3]/60" />
                <span className="h-3 w-3 rounded-full bg-[#2196F3]" />
              </div>
              <span className="text-[11px] font-medium text-[#90CAF9]">
                zadatkomat.pl/z/INK-9930
              </span>
              <span className="text-[11px] font-semibold text-[#90CAF9]">
                BLIK Aktywny
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-white/10">
              <div className="md:col-span-7 p-6 sm:p-8 space-y-4">
                <p className="text-xs font-medium text-[#90CAF9]">
                  Wiadomość wygenerowana do wklejenia na Instagrama:
                </p>
                <div className="rounded-[6px] bg-white/5 border border-[#90CAF9]/20 p-4 text-xs sm:text-sm leading-relaxed text-[#E3F2FD]">
                  „Cześć Wiktoria! Rezerwuję termin{' '}
                  <span className="text-white font-semibold">piątek o 14:30</span> na mały
                  tatuaż (nadgarstek, 6 cm). Aby zablokować termin w grafiku, opłać proszę
                  zadatek (<span className="text-[#90CAF9] font-semibold">150 zł</span>)
                  BLIK-iem w ciągu 15 min:{' '}
                  <span className="underline text-white">zadatkomat.pl/z/INK-9930</span>”
                </div>
                <div className="flex flex-wrap items-center gap-4 pt-1">
                  <Link
                    href="/z/INK-9930"
                    className="rounded-[5px] bg-[#2196F3] px-4 py-2 text-xs font-semibold text-white hover:bg-[#90CAF9] hover:text-[#0A192F] transition-colors"
                  >
                    Przetestuj kartę płatności BLIK →
                  </Link>
                  <Link
                    href="/s/ink-soul-tattoo"
                    className="text-xs font-medium text-[#90CAF9] hover:text-white transition-colors"
                  >
                    Zobacz profil salonu demo
                  </Link>
                </div>
              </div>

              <div className="md:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-[#0D47A1]/30 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#90CAF9]">Status terminu</span>
                    <span className="rounded bg-[#2196F3]/25 border border-[#90CAF9]/30 px-2 py-0.5 text-[11px] font-medium text-[#E3F2FD]">
                      Zabezpieczono
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#90CAF9]">Wartość wizyty</span>
                    <span className="font-semibold text-white">450 zł</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#90CAF9]">Zadatek BLIK</span>
                    <span className="font-semibold text-white">150 zł</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#90CAF9]">Regulamin</span>
                    <span className="text-[#E3F2FD]">art. 394 KC (48h)</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#90CAF9] border-t border-white/10 pt-3">
                  Po wpłacie klient pobiera wydarzenie prosto do kalendarza w telefonie (.ics).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: 60% / 40% EDITORIAL LAYOUT WITH CALCULATOR */}
      <section className="w-full flex justify-center">
        <div className="w-[90%] md:w-[80%] max-w-6xl py-16 sm:py-20 flex flex-col-reverse lg:flex-row items-center gap-12">
          <div className="w-full lg:w-[56%] flex flex-col gap-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A192F] leading-tight">
              W pełni dopasowany system rezerwacji i zadatków dla Twojej branży
            </h2>
            <p className="text-[15px] text-[#334E68] font-medium leading-relaxed">
              Zwykłe kalendarze każą Ci płacić wysoki abonament albo zabierają prowizję od
              klienta. W Zadatkomacie zbierasz wytyczne pod swoją usługę (rozmiar tatuażu,
              gabaryt auta lub rasę psa), blokujesz termin na 15 minut i automatycznie
              przyjmujesz wpłatę BLIK z regulaminem przepadku zadatku.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link href="/panel?mode=register" className="product-link">
                Załóż darmowe konto
              </Link>
              <Link
                href="/panel"
                className="text-sm font-semibold text-[#0D47A1] hover:text-[#2196F3] transition-colors"
              >
                Mam już konto →
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-[44%]">
            <NoShowCalculator />
          </div>
        </div>
      </section>

      {/* SECTION 3: 3 INDUSTRY DEMOS */}
      <section className="w-full border-t border-[#90CAF9]/35 flex justify-center">
        <div className="w-[90%] md:w-[80%] max-w-6xl py-16 space-y-8">
          <div className="max-w-2xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A192F]">
              Przetestuj gotowe profile branżowe na żywo
            </h2>
            <p className="mt-2 text-sm text-[#334E68] font-medium">
              Każda branża ma własne pola formularza, dzięki czemu od razu dostajesz komplet
              informacji o kliencie.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {niches.map((niche) => (
              <div
                key={niche.slug}
                className="flex flex-col justify-between rounded-[10px] border border-[#90CAF9]/50 bg-white/85 backdrop-blur-md p-6 hover:border-[#2196F3] transition-colors shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="rounded bg-[#E3F2FD] px-2.5 py-0.5 font-semibold text-[#0D47A1]">
                      {niche.tag}
                    </span>
                    <span className="text-[#627D98]">{niche.ticket}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-[#0A192F]">{niche.title}</h3>
                  <p className="mt-2 text-sm text-[#334E68] leading-relaxed">
                    {niche.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E3F2FD]">
                  <Link href={`/s/${niche.slug}`} className="product-link !w-full">
                    Zobacz profil demo &#8211; <span>/s/{niche.slug}</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PRICING */}
      <section className="w-full border-t border-[#90CAF9]/35 flex justify-center">
        <div className="w-[90%] md:w-[80%] max-w-6xl py-16 space-y-10">
          <div className="text-center max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0A192F]">
              Zacznij za 0 zł — płać tylko wtedy, gdy zarabiasz
            </h2>
            <p className="mt-2 text-sm text-[#334E68] font-medium">
              Bez długoterminowych umów i bez ukrytych prowizji od ceny Twojej usługi.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* START */}
            <div className="flex flex-col justify-between rounded-[10px] border border-[#90CAF9] bg-white/85 backdrop-blur-md p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#2196F3]">
                  Plan START
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[#0A192F] tabular-nums">
                    0 zł
                  </span>
                  <span className="text-sm text-[#334E68]">/ miesiąc</span>
                </div>
                <p className="mt-3 text-sm text-[#334E68] leading-relaxed">
                  Dla Ciebie w 100% darmowy. Przy wpłacie zadatku BLIK klient końcowy dopłaca
                  jedynie <strong className="text-[#0D47A1]">4,90 zł</strong> opłaty serwisowej
                  operatora.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-[#334E68]">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#2196F3] shrink-0" />
                    <span>Własny link rezerwacji do bio na Instagramie</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#2196F3] shrink-0" />
                    <span>Generator szybkich linków BLIK po wycenie w DM</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#2196F3] shrink-0" />
                    <span>Regulamin art. 394 KC + kalendarz .ics dla klienta</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/panel?mode=register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-[5px] border border-[#0D47A1] bg-white px-4 py-3 text-sm font-medium text-[#0D47A1] hover:bg-[#E3F2FD] transition-colors"
              >
                Załóż darmowe konto (0 zł)
              </Link>
            </div>

            {/* PRO */}
            <div className="flex flex-col justify-between rounded-[10px] border border-[#0D47A1] bg-[#0D47A1] p-8 text-white shadow-xl shadow-[#0D47A1]/15">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#90CAF9]">
                  Plan PRO
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white tabular-nums">49 zł</span>
                  <span className="text-sm text-[#90CAF9]">/ miesiąc</span>
                </div>
                <p className="mt-3 text-sm text-[#E3F2FD] leading-relaxed">
                  <strong className="text-white">0 zł opłaty serwisowej</strong> dla Twoich
                  klientów oraz automatyczne powiadomienia SMS i Lista Rezerwowa.
                </p>

                <ul className="mt-6 space-y-3 text-sm text-[#E3F2FD]">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#90CAF9] shrink-0" />
                    <span>Wszystko ze START + brak dopłaty 4,90 zł dla klienta</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#90CAF9] shrink-0" />
                    <span>Automatyczne SMS-y przypominające 24h przed wizytą</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-[#90CAF9] shrink-0" />
                    <span>Automatyczna Lista Rezerwowa wypełniająca odwołania</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/panel?mode=register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-[5px] bg-white px-4 py-3 text-sm font-semibold text-[#0D47A1] hover:bg-[#E3F2FD] transition-colors"
              >
                Wypróbuj Plan PRO
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
