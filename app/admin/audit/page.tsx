import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AuditClient } from './AuditClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'سجل التدقيق' };

export default async function AuditPage() {
  const user     = await requireRole(['platform_admin', 'university_admin']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('*, actor:profiles(full_name, full_name_ar, email)')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="سجل التدقيق">
      <AuditClient logs={logs ?? []} />
    </DashboardShell>
  );
}
