import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { MyCoursesClient } from './MyCoursesClient';
export const metadata = { title: 'مقرراتي' };
export default async function MyCoursesPage() {
  const user=await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin','registrar']);
  const supabase=createClient(); const isStudent=user.roles.includes('student');
  let enrollments:any[]=[]; let sections:any[]=[];
  if(isStudent){
    const {data:student}=await supabase.from('students').select('id').eq('profile_id',user.id).single();
    if(student){const {data}=await supabase.from('enrollments').select('id,status,enrolled_at,section:sections(id,code,room,status,enrolled_count,capacity,course:courses(id,code,name_ar,name_en,credits,level),semester:semesters(id,name_ar,name_en,is_active),professor:profiles(full_name,full_name_ar,avatar_url))').eq('student_id',student.id).eq('status','enrolled');enrollments=data??[];}
  } else {
    const {data}=await supabase.from('sections').select('id,code,room,status,enrolled_count,capacity,course:courses(id,code,name_ar,name_en,credits,level),semester:semesters(id,name_ar,name_en,is_active)').eq('professor_id',user.id).eq('status','open');sections=data??[];
  }
  const sectionIds=isStudent?enrollments.map((e:any)=>e.section?.id).filter(Boolean):sections.map((s:any)=>s.id);
  const {data:lessonCounts}=await supabase.from('lms_lessons').select('section_id').in('section_id',sectionIds).eq('is_published',true);
  const {data:liveSessions}=await supabase.from('lms_live_sessions').select('section_id,scheduled_at,status,title').in('section_id',sectionIds).eq('status','scheduled').gte('scheduled_at',new Date().toISOString()).order('scheduled_at').limit(10);
  return (
    <DashboardShell user={user} pageTitle="مقرراتي">
      <MyCoursesClient user={user} enrollments={enrollments} sections={sections} lessonCounts={lessonCounts??[]} upcomingLive={liveSessions??[]} isStudent={isStudent}/>
    </DashboardShell>
  );
}
