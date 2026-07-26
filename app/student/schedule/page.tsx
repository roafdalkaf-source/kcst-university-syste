import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentScheduleClient } from './StudentScheduleClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'جدولي الأسبوعي' };

export default async function StudentSchedulePage() {
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
        id, code, room, schedule,
        course:courses(code, name_ar, name_en, credits),
        professor:profiles(full_name, full_name_ar),
        semester:semesters(name_ar, is_active)
      )
    `)
    .eq('student_id', student?.id ?? '')
    .eq('status', 'enrolled');

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="جدولي الأسبوعي">
      <StudentScheduleClient enrollments={enrollments ?? []} />
    </DashboardShell>
  );
}
