import { getAuthenticatedStudioId } from '@/lib/auth';
import { getDb, getStudioById, toSafeStudio } from '@/lib/db';
import { SalonAuthClient } from '@/components/SalonAuthClient';
import { SalonPanelClient } from '@/components/SalonPanelClient';

export const dynamic = 'force-dynamic';

export default async function PanelPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const sp = await searchParams;
  const studioId = await getAuthenticatedStudioId();

  if (!studioId) {
    return (
      <SalonAuthClient
        initialMode={sp.mode === 'register' ? 'register' : 'login'}
      />
    );
  }

  const studio = getStudioById(studioId);
  if (!studio) {
    return (
      <SalonAuthClient
        initialMode={sp.mode === 'register' ? 'register' : 'login'}
      />
    );
  }

  const db = getDb();
  const studioBookings = db.bookings.filter((b) => b.studioId === studio.id);
  const studioWaitlist = db.waitlist.filter((w) => w.studioId === studio.id);

  return (
    <SalonPanelClient
      initialStudio={toSafeStudio(studio)}
      initialBookings={studioBookings}
      initialWaitlist={studioWaitlist}
    />
  );
}
