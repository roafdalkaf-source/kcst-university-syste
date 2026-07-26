import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentCertificatesClient } from './StudentCertificatesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'شهاداتي' };

export default async function StudentCertificatesPage() {
  const user     = await requireRole(['student']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: student } = await supabase
    .from('students')
    .select('id, student_number, gpa, status, program:programs(name_ar, name_en, degree_level)')
    .eq('profile_id', user.id)
    .single();

  const { data: certificates } = await supabase
    .from('certificates')
    .select('*')
    .eq('student_id', student?.id ?? '')
    .order('issued_date', { ascending: false });

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="شهاداتي">
      <StudentCertificatesClient
        student={student}
        certificates={certificates ?? []}
        userName={user.full_name_ar ?? user.full_name}
      />
    </DashboardShell>
  );
}
