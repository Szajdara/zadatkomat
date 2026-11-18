import { verifyAdminSession } from '@/lib/auth';
import { computePlatformStats, getDb, toSafePlatformConfig, toSafeStudio } from '@/lib/db';
import { AdminDashboardClient } from '@/components/AdminDashboardClient';
import { AdminLoginClient } from '@/components/AdminLoginClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) {
    return <AdminLoginClient />;
  }

  const db = getDb();
  const stats = computePlatformStats(db);

  return (
    <AdminDashboardClient
      initialStudios={db.studios.map(toSafeStudio)}
      initialBookings={db.bookings}
      initialStats={stats}
      initialSubscriptions={db.subscriptions}
      initialConfig={toSafePlatformConfig(db.config)}
    />
  );
}
