import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { getDb, toSafePlatformConfig, updatePlatformConfig } from '@/lib/db';
import { assertSameOrigin } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 });
  }
  const db = getDb();
  return NextResponse.json({ config: toSafePlatformConfig(db.config) });
}

export async function POST(req: NextRequest) {
  if (!assertSameOrigin(req)) {
    return NextResponse.json({ error: 'Niedozwolone pochodzenie żądania (CSRF).' }, { status: 403 });
  }

  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Brak autoryzacji.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updated = updatePlatformConfig(body);
    return NextResponse.json({ config: toSafePlatformConfig(updated) });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Błąd zapisu konfiguracji.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
