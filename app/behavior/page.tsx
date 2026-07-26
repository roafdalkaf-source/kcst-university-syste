import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BehaviorClient } from './BehaviorClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'السجل السلوكي' };

export default async function BehaviorPage() {
  const user     = await requireRole(['platform_admin','university_admin','registrar','dean','department_head']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: records } = await supabase
    .from('behavior_records')
    .select(`
      *,
      student:students(
        id, student_number,
        profile:profiles(full_name, full_name_ar, email)
      ),
      recorder:profiles(full_name, full_name_ar)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  const { data: students } = await supabase
    .from('students')
    .select('id, student_number, profile:profiles(full_name, full_name_ar)')
    .eq('status', 'active')
    .order('student_number')
    .limit(500);

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="السجل السلوكي">
      <BehaviorClient records={records ?? []} students={students ?? []} adminId={user.id} />
    </DashboardShell>
  );
}
