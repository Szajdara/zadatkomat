import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#90CAF9]/35 bg-white/75 backdrop-blur-md">
      <div className="mx-auto w-[90%] md:w-[80%] max-w-6xl py-12 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[#0D47A1] text-[11px] font-bold text-white">
              Z
            </div>
            <span className="text-sm font-bold text-[#0A192F]">Zadatkomat.</span>
          </Link>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#627D98]">
            <li>
              <Link
                href="/s/ink-soul-tattoo"
                className="hover:text-[#0D47A1] transition-colors"
              >
                Demo: Tatuaż
              </Link>
            </li>
            <li>
              <Link
                href="/s/apex-detailing"
                className="hover:text-[#0D47A1] transition-colors"
              >
                Demo: Detailing
              </Link>
            </li>
            <li>
              <Link
                href="/s/lapka-groomer"
                className="hover:text-[#0D47A1] transition-colors"
              >
                Demo: Groomer
              </Link>
            </li>
            <li>
              <Link href="/panel" className="hover:text-[#0D47A1] transition-colors">
                Zaloguj się
              </Link>
            </li>
            <li>
              <Link
                href="/panel?mode=register"
                className="hover:text-[#0D47A1] transition-colors font-medium text-[#0D47A1]"
              >
                Załóż konto
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-center text-xs text-[#627D98]">
          Zadatkomat.pl — system szybkich zadatków BLIK bez prowizji dla usług premium.
        </div>
      </div>
    </footer>
  );
}
