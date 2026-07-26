import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CourseMembersClient } from './CourseMembersClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'أعضاء المقرر' };

export default async function CourseMembersPage({
  params,
}: { params: { courseId: string } }) {
  const user     = await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: section } = await supabase
    .from('sections')
    .select(`
      id, code, enrolled_count, capacity,
      course:courses(name_ar, name_en, code),
      professor:profiles(id, full_name, full_name_ar, avatar_url, email)
    `)
    .eq('id', params.courseId)
    .single();
  if (!section) notFound();

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id, enrolled_at,
      student:students(
        id, student_number, current_level,
        profile:profiles(id, full_name, full_name_ar, avatar_url, email)
      )
    `)
    .eq('section_id', params.courseId)
    .eq('status', 'enrolled')
    .order('enrolled_at');

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="أعضاء المقرر">
      <CourseMembersClient section={section} enrollments={enrollments ?? []} currentUserId={user.id} />
    </DashboardShell>
  );
}
