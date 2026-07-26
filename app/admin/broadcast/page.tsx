import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BroadcastClient } from './BroadcastClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'الإشعارات الجماعية' };

export default async function BroadcastPage() {
  const user     = await requireRole(['platform_admin','university_admin']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { count: totalUsers } = await supabase
    .from('profiles').select('*', { count:'exact', head:true }).eq('is_active', true);

  const roleCounts = await Promise.all([
    'student','professor','registrar','finance_officer','dean','department_head',
  ].map(async role => {
    const { count } = await supabase
      .from('user_roles').select('*', { count:'exact', head:true }).eq('role', role);
    return { role, count: count ?? 0 };
  }));

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="الإشعارات الجماعية">
      <BroadcastClient totalUsers={totalUsers ?? 0} roleCounts={roleCounts} adminId={user.id} />
    </DashboardShell>
  );
}
