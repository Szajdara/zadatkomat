import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import {
  computePlatformStats,
  getDb,
  toSafePlatformConfig,
  toSafeStudio,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji administratora.' }, { status: 401 });
  }

  const db = getDb();
  const stats = computePlatformStats(db);
  return NextResponse.json({
    studios: db.studios.map(toSafeStudio),
    bookings: db.bookings,
    waitlist: db.waitlist,
    subscriptions: db.subscriptions,
    config: toSafePlatformConfig(db.config),
    stats,
  });
}
