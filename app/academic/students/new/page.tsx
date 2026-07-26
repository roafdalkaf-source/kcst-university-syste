import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { NewStudentClient } from './NewStudentClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'إضافة طالب جديد' };

export default async function NewStudentPage() {
  const user     = await requireRole(['platform_admin','university_admin','registrar']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: programs } = await supabase
    .from('programs')
    .select('id, code, name_ar, name_en, degree_level, department:departments(name_ar, faculty:faculties(name_ar))')
    .eq('is_active', true)
    .order('name_ar');

  // Get next student sequence
  const { count } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });

  const nextSeq = (count ?? 0) + 1;
  const year    = new Date().getFullYear();
  const nextNo  = `KCST-${year}-${String(nextSeq).padStart(4, '0')}`;

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="إضافة طالب جديد">
      <NewStudentClient programs={programs ?? []} suggestedNo={nextNo} adminId={user.id} />
    </DashboardShell>
  );
}
