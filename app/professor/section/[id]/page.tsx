import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ProfessorCourseClient } from './ProfessorCourseClient';
import { notFound } from 'next/navigation';
export const metadata = { title: 'إدارة المقرر' };
export default async function ProfessorCoursePage({ params }: { params: { id: string } }) {
  const user=await requireRole(['professor','teaching_assistant','platform_admin','university_admin']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:section}=await supabase.from('sections').select('*,course:courses(id,code,name_ar,name_en,description,credits),semester:semesters(name_ar,name_en,is_active),enrollments(id,status)').eq('id',params.id).single();
  if(!section) notFound();
  const [{data:lessons},{data:assignments},{data:quizzes},{data:live},{data:announcements}]=await Promise.all([
    supabase.from('lms_lessons').select('*').eq('section_id',params.id).order('order_index'),
    supabase.from('lms_assignments').select('*').eq('section_id',params.id).order('order_index'),
    supabase.from('lms_quizzes').select('*,questions:lms_questions(count)').eq('section_id',params.id).order('order_index'),
    supabase.from('lms_live_sessions').select('*').eq('section_id',params.id).order('scheduled_at',{ascending:false}).limit(5),
    supabase.from('lms_announcements').select('*').eq('section_id',params.id).order('created_at',{ascending:false}).limit(5),
  ]);
  const enrolledCount=(section.enrollments??[]).filter((e:any)=>e.status==='enrolled').length;
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="إدارة المقرر">
      <ProfessorCourseClient user={user} section={section} enrolledCount={enrolledCount} lessons={lessons??[]} assignments={assignments??[]} quizzes={quizzes??[]} live={live??[]} announcements={announcements??[]}/>
    </DashboardShell>
  );
}
