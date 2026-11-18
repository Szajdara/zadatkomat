import { NextRequest, NextResponse } from 'next/server';
import { searchPublicStudiosAndBooking } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`search:${ip}`, 60, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Zbyt wiele zapytań wyszukiwania.' }, { status: 429 });
  }

  const q = req.nextUrl.searchParams.get('q') ?? '';
  const results = searchPublicStudiosAndBooking(q);
  return NextResponse.json(results);
}
