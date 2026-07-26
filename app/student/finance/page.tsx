import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentFinanceClient } from './StudentFinanceClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'حسابي المالي' };

export default async function StudentFinancePage() {
  const user     = await requireRole(['student']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: student } = await supabase
    .from('students').select('id').eq('profile_id', user.id).single();

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, semester:semesters(name_ar, name_en), payments(id, amount, method, paid_at, reference_no)')
    .eq('student_id', student?.id ?? '')
    .order('created_at', { ascending: false });

  const totalBalance = (invoices ?? []).reduce((s,i) => s + (i.balance ?? 0), 0);
  const totalPaid    = (invoices ?? []).reduce((s,i) => s + (i.paid_amount ?? 0), 0);

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="حسابي المالي">
      <StudentFinanceClient invoices={invoices ?? []} totalBalance={totalBalance} totalPaid={totalPaid} />
    </DashboardShell>
  );
}
