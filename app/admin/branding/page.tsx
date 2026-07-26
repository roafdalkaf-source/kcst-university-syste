import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BrandingClient } from './BrandingClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'الهوية البصرية' };

export default async function BrandingPage() {
  const user     = await requireRole(['platform_admin','university_admin']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="الهوية البصرية">
      <BrandingClient initialBranding={branding} adminId={user.id} />
    </DashboardShell>
  );
}
