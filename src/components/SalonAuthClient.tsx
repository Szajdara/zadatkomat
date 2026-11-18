'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { IndustryType } from '@/lib/types';

interface SalonAuthClientProps {
  initialMode?: 'login' | 'register';
}

export function SalonAuthClient({ initialMode = 'login' }: SalonAuthClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regIndustry, setRegIndustry] = useState<IndustryType>('tattoo');
  const [regCity, setRegCity] = useState('');
  const [regInstagram, setRegInstagram] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd logowania.');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Błąd logowania.');
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoSlug: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          demoSlug,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się otworzyć konta demo.');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Błąd logowania demo.');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: regName,
          industry: regIndustry,
          city: regCity,
          instagram: regInstagram,
          phone: regPhone,
          email: regEmail,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd rejestracji.');
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Błąd rejestracji.');
      setLoading(false);
    }
  };

  return (
    <div className="snipper-soft-tint w-full min-h-[calc(100vh-140px)] py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-md rounded-[10px] border border-[#90CAF9]/50 bg-white overflow-hidden shadow-xl shadow-[#0D47A1]/5">
        <div className="grid grid-cols-2 border-b border-[#90CAF9]/35 bg-[#E3F2FD]/45">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
            }}
            className={`py-3.5 text-xs font-semibold transition-colors ${
              mode === 'login'
                ? 'bg-white text-[#0D47A1] border-b-2 border-[#0D47A1]'
                : 'text-[#627D98] hover:text-[#0D47A1]'
            }`}
          >
            Zaloguj się
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
            }}
            className={`py-3.5 text-xs font-semibold transition-colors ${
              mode === 'register'
                ? 'bg-white text-[#0D47A1] border-b-2 border-[#0D47A1]'
                : 'text-[#627D98] hover:text-[#0D47A1]'
            }`}
          >
            Załóż konto (0 zł)
          </button>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {errorMsg}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h1 className="text-lg font-bold text-[#0A192F]">
                  Zaloguj się do swojego salonu
                </h1>
                <p className="mt-0.5 text-xs text-[#334E68]">
                  Dostęp wyłącznie do Twojego kalendarza, zadatków i cennika.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  Adres e-mail
                </label>
                <input
                  type="text"
                  required
                  placeholder="kontakt@twojsalon.pl"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">Hasło</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="product-link !w-full disabled:opacity-60"
              >
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <h1 className="text-lg font-bold text-[#0A192F]">
                  Załóż darmowe konto salonu
                </h1>
                <p className="mt-0.5 text-xs text-[#334E68]">
                  Plan START: 0 zł miesięcznie. Twój profil będzie gotowy w 30 sekund.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  Nazwa studia / firmy *
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. Studio Kreska Kraków"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Branża *
                  </label>
                  <select
                    value={regIndustry}
                    onChange={(e) => setRegIndustry(e.target.value as IndustryType)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-xs focus:border-[#2196F3] focus:outline-none"
                  >
                    <option value="tattoo">Tatuaż & PMU</option>
                    <option value="detailing">Auto Detailing</option>
                    <option value="groomer">Groomer (Psy)</option>
                    <option value="other">Inne Usługi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Miasto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="np. Gdańsk"
                    value={regCity}
                    onChange={(e) => setRegCity(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Instagram
                  </label>
                  <input
                    type="text"
                    placeholder="@twojprofil"
                    value={regInstagram}
                    onChange={(e) => setRegInstagram(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#334E68]">
                    Telefon kontaktowy
                  </label>
                  <input
                    type="tel"
                    placeholder="500 600 700"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm tabular-nums focus:border-[#2196F3] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  Adres e-mail do logowania *
                </label>
                <input
                  type="email"
                  required
                  placeholder="wlasciciel@twojsalon.pl"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#334E68]">
                  Hasło (min. 6 znaków) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 znaków"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="product-link !w-full disabled:opacity-60"
              >
                {loading ? 'Tworzę konto...' : 'Załóż darmowe konto'}
              </button>
            </form>
          )}

          <div className="border-t border-[#E3F2FD] pt-4 space-y-2.5">
            <p className="text-[11px] font-medium text-[#334E68] text-center">
              Chcesz najpierw zobaczyć, jak działa panel od środka?
            </p>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleDemoLogin('ink-soul-tattoo')}
              className="w-full rounded-[5px] border border-[#90CAF9] bg-[#E3F2FD]/50 px-3 py-2 text-xs font-medium text-[#0D47A1] hover:bg-[#E3F2FD] transition-colors disabled:opacity-50"
            >
              Zobacz działanie na koncie Demo (INK & SOUL Tattoo)
            </button>
            <p className="text-center text-[11px] text-[#627D98]">
              <Link href="/" className="hover:text-[#0D47A1] underline">
                Wróć na stronę główną
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
