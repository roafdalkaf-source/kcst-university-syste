import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { GradeSheetClient } from './GradeSheetClient';
import { notFound } from 'next/navigation';
export const metadata = { title: 'جدول الدرجات' };
export default async function GradeSheetPage({ params }: { params: { id: string } }) {
  const user=await requireRole(['professor','teaching_assistant','platform_admin','university_admin','registrar']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:section}=await supabase.from('sections').select('*,course:courses(name_ar,name_en,code,credits),semester:semesters(name_ar,name_en),professor:profiles(full_name,full_name_ar)').eq('id',params.id).single();
  if(!section) notFound();
  const {data:enrollments}=await supabase.from('enrollments').select('id,student:students(id,student_number,profile:profiles(full_name,full_name_ar,email)),grade:grade_entries(id,participation,assignments,midterm,final,total,letter,is_published,grade_points)').eq('section_id',params.id).eq('status','enrolled').order('created_at');
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="جدول الدرجات">
      <GradeSheetClient section={section} enrollments={enrollments??[]} userId={user.id}/>
    </DashboardShell>
  );
}
