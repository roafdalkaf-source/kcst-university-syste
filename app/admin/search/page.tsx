import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { SearchClient } from './SearchClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'البحث الشامل' };

export default async function SearchPage() {
  const user     = await requireRole(['platform_admin','university_admin','registrar','dean']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="البحث الشامل">
      <SearchClient />
    </DashboardShell>
  );
}
