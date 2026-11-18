'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRight, Menu, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SearchStudioResult {
  slug: string;
  name: string;
  city: string;
  industryLabel: string;
  instagram: string;
}

interface SearchBookingResult {
  shortCode: string;
  studioName: string;
  serviceName: string;
  date: string;
  time: string;
  status: string;
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [studios, setStudios] = useState<SearchStudioResult[]>([]);
  const [bookingMatch, setBookingMatch] = useState<SearchBookingResult | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!searchOpen) return;
    let active = true;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (active && res.ok) {
          setStudios(data.studios || []);
          setBookingMatch(data.booking || null);
        }
      } finally {
        if (active) setSearching(false);
      }
    }, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, searchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingMatch) {
      setSearchOpen(false);
      router.push(`/z/${bookingMatch.shortCode}`);
      return;
    }
    if (studios.length === 1) {
      setSearchOpen(false);
      router.push(`/s/${studios[0].slug}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#90CAF9]/35 bg-white/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-[90%] md:w-[80%] max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-[5px] bg-[#0D47A1] text-xs font-bold text-white shadow-xs">
            Z
          </div>
          <span className="text-base font-bold tracking-tight text-[#0A192F]">
            Zadatkomat.
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#334E68] hover:text-[#2196F3] transition-colors"
            title="Szukaj salonu lub wpisz kod rezerwacji"
            aria-label="Szukaj salonu lub kodu rezerwacji"
          >
            <Search className="h-4 w-4" />
            <span>Szukaj</span>
          </button>

          <Link
            href="/s/ink-soul-tattoo"
            className={`text-sm font-normal transition-colors ${
              pathname?.startsWith('/s/')
                ? 'font-semibold text-[#0D47A1]'
                : 'text-[#334E68] hover:text-[#0D47A1]'
            }`}
          >
            Zobacz demo
          </Link>

          <Link
            href="/panel"
            className={`text-sm font-normal transition-colors ${
              pathname === '/panel'
                ? 'font-semibold text-[#0D47A1]'
                : 'text-[#334E68] hover:text-[#0D47A1]'
            }`}
          >
            Zaloguj się
          </Link>

          <Link href="/panel?mode=register" className="product-link">
            Załóż darmowe konto
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center p-2 text-[#0D47A1]"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Live Search Bar */}
      {searchOpen && (
        <div className="border-t border-[#90CAF9]/35 bg-white/95 py-4 shadow-sm">
          <div className="mx-auto w-[90%] md:w-[80%] max-w-6xl space-y-3">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <input
                type="text"
                autoFocus
                placeholder="Wpisz nazwę salonu, miasto (np. Warszawa) lub kod rezerwacji (np. INK-9930)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded-[5px] border border-[#90CAF9] bg-white px-3.5 py-2 text-xs text-[#0A192F] focus:border-[#2196F3] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="rounded-[5px] border border-[#90CAF9]/60 px-3 py-2 text-xs font-medium text-[#334E68] hover:text-[#0D47A1]"
              >
                Zamknij
              </button>
            </form>

            {bookingMatch && (
              <Link
                href={`/z/${bookingMatch.shortCode}`}
                onClick={() => setSearchOpen(false)}
                className="flex items-center justify-between rounded-[6px] border border-[#2196F3] bg-[#E3F2FD]/60 px-4 py-2.5 text-xs hover:bg-[#E3F2FD]"
              >
                <div>
                  <span className="font-bold text-[#0D47A1]">
                    Znaleziono rezerwację {bookingMatch.shortCode}
                  </span>
                  <span className="ml-2 text-[#334E68]">
                    {bookingMatch.studioName} • {bookingMatch.date} {bookingMatch.time}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 font-semibold text-[#0D47A1]">
                  Otwórz kartę <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            )}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#627D98]">
                {searching ? 'Szukam...' : 'Dostępne salony:'}
              </span>
              {studios.map((st) => (
                <Link
                  key={st.slug}
                  href={`/s/${st.slug}`}
                  onClick={() => setSearchOpen(false)}
                  className="rounded-[5px] border border-[#90CAF9]/70 bg-white px-3 py-1.5 font-medium text-[#0D47A1] hover:bg-[#0D47A1] hover:text-white transition-colors"
                >
                  {st.name} ({st.city})
                </Link>
              ))}
              {!searching && studios.length === 0 && !bookingMatch && (
                <span className="text-[#627D98]">Brak wyników dla „{query}”.</span>
              )}
            </div>
          </div>
        </div>
      )}

      {open && (
        <div className="md:hidden border-t border-[#90CAF9]/30 bg-white px-6 py-5 space-y-4">
          <Link
            href="/s/ink-soul-tattoo"
            onClick={() => setOpen(false)}
            className="block text-sm font-normal text-[#0A192F]"
          >
            Zobacz demo profilu
          </Link>
          <Link
            href="/panel"
            onClick={() => setOpen(false)}
            className="block text-sm font-normal text-[#0A192F]"
          >
            Zaloguj się
          </Link>
          <Link
            href="/panel?mode=register"
            onClick={() => setOpen(false)}
            className="product-link w-full"
          >
            Załóż darmowe konto
          </Link>
        </div>
      )}
    </header>
  );
}
