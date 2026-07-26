import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AnnouncementsPageClient } from './AnnouncementsPageClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'إعلانات المقرر' };

export default async function AnnouncementsPage({
  params,
}: { params: { courseId: string } }) {
  const user     = await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const branding = await getBranding();
  const unread   = await getUnreadCount(user.id);
  const supabase = createClient();

  const { data: section } = await supabase
    .from('sections')
    .select(`id, professor_id, course:courses(name_ar, name_en, code)`)
    .eq('id', params.courseId)
    .single();
  if (!section) notFound();

  const { data: announcements } = await supabase
    .from('lms_announcements')
    .select('*, author:profiles(full_name, full_name_ar)')
    .eq('section_id', params.courseId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const isProfessor = user.roles.some(r =>
    ['professor','teaching_assistant','platform_admin','university_admin'].includes(r)
  ) && (section.professor_id === user.id || ['platform_admin','university_admin'].some(r => user.roles.includes(r)));

  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="إعلانات المقرر">
      <AnnouncementsPageClient
        announcements={announcements ?? []}
        courseId={params.courseId}
        section={section}
        userId={user.id}
        isProfessor={isProfessor}
      />
    </DashboardShell>
  );
}
