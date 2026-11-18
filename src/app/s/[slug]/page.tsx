import Link from 'next/link';
import { Store } from 'lucide-react';
import { getDb, getStudioBySlug, isSlotOccupied, toSafeStudio } from '@/lib/db';
import { PublicStudioClient } from '@/components/PublicStudioClient';

export const dynamic = 'force-dynamic';

export default async function StudioPublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const studio = getStudioBySlug(slug);

  if (!studio) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-[10px] border border-[#90CAF9]/50 bg-white p-6 text-center space-y-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-[5px] border border-[#90CAF9]/60 bg-[#E3F2FD] text-[#0D47A1]">
            <Store className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-[11px] text-[#627D98]">404 /s/{slug}</p>
            <h1 className="text-lg font-bold text-[#0A192F]">
              Nie znaleziono profilu studia
            </h1>
            <p className="text-xs text-[#334E68] leading-relaxed">
              Możesz założyć taki profil w 30 sekund w Panelu Salonu.
            </p>
          </div>
          <div className="flex justify-center gap-2 pt-1">
            <Link
              href="/panel?mode=register"
              className="rounded-[5px] bg-[#0D47A1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2196F3]"
            >
              Załóż konto
            </Link>
            <Link
              href="/s/ink-soul-tattoo"
              className="rounded-[5px] border border-[#90CAF9] bg-white px-4 py-2 text-xs font-medium text-[#0D47A1] hover:bg-[#E3F2FD]"
            >
              Demo tatuażu
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const db = getDb();
  const nowMs = Date.now();
  const occupiedSlots = db.bookings
    .filter((b) => b.studioId === studio.id && isSlotOccupied(b, nowMs))
    .map((b) => ({ date: b.date, time: b.time }));

  return (
    <PublicStudioClient
      studio={toSafeStudio(studio)}
      occupiedSlots={occupiedSlots}
    />
  );
}
