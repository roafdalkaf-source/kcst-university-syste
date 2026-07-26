import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentAttendanceClient } from './StudentAttendanceClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'حضوري' };

export default async function StudentAttendancePage() {
  const user     = await requireRole(['student']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: student } = await supabase
    .from('students').select('id').eq('profile_id', user.id).single();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      section:sections(
        code,
        course:courses(code, name_ar, name_en, credits),
        semester:semesters(name_ar, is_active)
      ),
      attendance(id, date, status, notes)
    `)
    .eq('student_id', student?.id ?? '')
    .eq('status', 'enrolled');

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="حضوري">
      <StudentAttendanceClient enrollments={enrollments ?? []} />
    </DashboardShell>
  );
}
