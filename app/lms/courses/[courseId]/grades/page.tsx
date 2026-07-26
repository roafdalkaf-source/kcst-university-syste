import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LmsCourseGradesClient } from './LmsCourseGradesClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'درجات المقرر' };

export default async function LmsCourseGradesPage({
  params,
}: { params: { courseId: string } }) {
  const user     = await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: section } = await supabase
    .from('sections')
    .select(`id, code, course:courses(name_ar, name_en, code, credits)`)
    .eq('id', params.courseId)
    .single();
  if (!section) notFound();

  const isStudent   = user.roles.includes('student');
  const isProfessor = !isStudent;

  let enrollmentId: string | null = null;
  let quizAttempts:    any[] = [];
  let submissions:     any[] = [];
  let gradeEntry:      any   = null;
  let allStudentGrades: any[] = [];

  if (isStudent) {
    const { data: student } = await supabase
      .from('students').select('id').eq('profile_id', user.id).single();
    if (student) {
      const { data: enr } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', student.id)
        .eq('section_id', params.courseId)
        .single();
      enrollmentId = enr?.id ?? null;

      if (enrollmentId) {
        const [{ data: attempts }, { data: subs }, { data: grade }] = await Promise.all([
          supabase.from('lms_quiz_attempts')
            .select('*, quiz:lms_quizzes(title, title_ar, max_score)')
            .eq('enrollment_id', enrollmentId)
            .in('status', ['graded','submitted'])
            .order('submitted_at', { ascending: false }),
          supabase.from('lms_submissions')
            .select('*, assignment:lms_assignments(title, title_ar, max_score)')
            .eq('enrollment_id', enrollmentId)
            .order('submitted_at', { ascending: false }),
          supabase.from('grade_entries')
            .select('*')
            .eq('enrollment_id', enrollmentId)
            .single(),
        ]);
        quizAttempts = attempts ?? [];
        submissions  = subs ?? [];
        gradeEntry   = grade;
      }
    }
  } else {
    // Professor sees summary for all students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select(`
        id,
        student:students(student_number, profile:profiles(full_name, full_name_ar)),
        grade:grade_entries(total, letter, is_published)
      `)
      .eq('section_id', params.courseId)
      .eq('status', 'enrolled');
    allStudentGrades = enrollments ?? [];
  }

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="درجات المقرر">
      <LmsCourseGradesClient
        section={section}
        isStudent={isStudent}
        enrollmentId={enrollmentId}
        quizAttempts={quizAttempts}
        submissions={submissions}
        gradeEntry={gradeEntry}
        allStudentGrades={allStudentGrades}
        courseId={params.courseId}
      />
    </DashboardShell>
  );
}
