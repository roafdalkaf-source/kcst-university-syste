import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentGradesClient } from './StudentGradesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'درجاتي' };

export default async function StudentGradesPage() {
  const user     = await requireRole(['student']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: student } = await supabase
    .from('students').select('id, gpa, total_credits').eq('profile_id', user.id).single();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, status,
      section:sections(
        code,
        course:courses(code, name_ar, name_en, credits, level),
        semester:semesters(name_ar, name_en, academic_year, term)
      ),
      grade:grade_entries(participation, assignments, midterm, final, total, letter, grade_points, is_published)
    `)
    .eq('student_id', student?.id ?? '')
    .neq('status', 'dropped')
    .order('created_at', { ascending: false });

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="درجاتي">
      <StudentGradesClient enrollments={enrollments ?? []} gpa={student?.gpa ?? 0} totalCredits={student?.total_credits ?? 0} />
    </DashboardShell>
  );
}
