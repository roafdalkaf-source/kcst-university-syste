import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { QuizzesListClient } from './QuizzesListClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'الاختبارات' };

export default async function QuizzesPage({ params }: { params: { courseId: string } }) {
  const user     = await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: section } = await supabase
    .from('sections').select('id, professor_id, course:courses(name_ar, name_en, code)')
    .eq('id', params.courseId).single();
  if (!section) notFound();

  const { data: quizzes } = await supabase
    .from('lms_quizzes')
    .select('*, questions:lms_questions(id)')
    .eq('section_id', params.courseId)
    .eq('is_published', true)
    .order('order_index');

  // Get student's attempts
  let attempts: any[] = [];
  if (user.roles.includes('student')) {
    const { data: student } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single();
    if (student) {
      const { data: enr } = await supabase
        .from('enrollments').select('id').eq('student_id', student.id).eq('section_id', params.courseId).single();
      if (enr) {
        const { data: att } = await supabase
          .from('lms_quiz_attempts').select('quiz_id, attempt_number, percentage, passed, status')
          .eq('enrollment_id', enr.id);
        attempts = att ?? [];
      }
    }
  }

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="الاختبارات">
      <QuizzesListClient
        quizzes={quizzes ?? []}
        attempts={attempts}
        courseId={params.courseId}
        section={section}
      />
    </DashboardShell>
  );
}
