import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AssignmentsListClient } from './AssignmentsListClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'الواجبات' };

export default async function AssignmentsPage({ params }: { params: { courseId: string } }) {
  const user     = await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: section } = await supabase
    .from('sections').select('id, professor_id, course:courses(name_ar, name_en)')
    .eq('id', params.courseId).single();
  if (!section) notFound();

  const { data: assignments } = await supabase
    .from('lms_assignments').select('*')
    .eq('section_id', params.courseId).eq('is_published', true)
    .order('order_index');

  // Student submissions
  let submissions: any[] = [];
  let enrollmentId: string | null = null;
  if (user.roles.includes('student')) {
    const { data: student } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single();
    if (student) {
      const { data: enr } = await supabase
        .from('enrollments').select('id').eq('student_id', student.id).eq('section_id', params.courseId).single();
      enrollmentId = enr?.id ?? null;
      if (enrollmentId) {
        const { data: subs } = await supabase
          .from('lms_submissions').select('assignment_id, status, score, submitted_at')
          .eq('enrollment_id', enrollmentId);
        submissions = subs ?? [];
      }
    }
  }

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="الواجبات">
      <AssignmentsListClient
        assignments={assignments ?? []}
        submissions={submissions}
        courseId={params.courseId}
        section={section}
        isStudent={user.roles.includes('student')}
      />
    </DashboardShell>
  );
}
