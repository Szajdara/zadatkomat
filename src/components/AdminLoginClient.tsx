'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export function AdminLoginClient() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Odmowa dostępu.');
      }
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Błąd autoryzacji.');
      setLoading(false);
    }
  };

  return (
    <div className="snipper-soft-tint w-full min-h-[calc(100vh-140px)] py-16 px-4">
      <div className="mx-auto max-w-sm rounded-[10px] border border-[#90CAF9]/50 bg-white p-6 shadow-xl shadow-[#0D47A1]/5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[5px] bg-[#0D47A1] text-white">
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-[#0A192F]">Dostęp zastrzeżony</h1>
            <p className="text-[11px] text-[#334E68]">
              Panel właściciela platformy Zadatkomat
            </p>
          </div>
        </div>

        <p className="text-xs text-[#334E68] leading-relaxed">
          Wprowadź hasło administratora zdefiniowane w konfiguracji serwera (
          <code className="text-[#0D47A1] font-semibold">ADMIN_PASSWORD</code>).
        </p>

        {errorMsg && (
          <div className="rounded-[5px] border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-[#334E68]">
              Hasło administratora
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-[5px] border border-[#90CAF9]/70 px-3 py-2 text-sm focus:border-[#2196F3] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="product-link !w-full disabled:opacity-60"
          >
            {loading ? 'Weryfikacja...' : 'Odblokuj panel'}
          </button>
        </form>
      </div>
    </div>
  );
}
