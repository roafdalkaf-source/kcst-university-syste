import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentDashboardClient } from './StudentDashboardClient';
export const metadata = { title: 'لوحتي' };
export default async function StudentDashboardPage() {
  const user=await requireRole(['student']); const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:student}=await supabase.from('students').select('*,program:programs(name_ar,name_en,department:departments(name_ar,faculty:faculties(name_ar)))').eq('profile_id',user.id).single();
  let enrollments:any[]=[]; let lmsStats:any[]=[]; let invoices:any[]=[]; let upcomingLive:any[]=[];
  if(student){
    const {data:enrData}=await supabase.from('enrollments').select('id,status,section:sections(id,code,course:courses(name_ar,name_en,code,credits),professor:profiles(full_name,full_name_ar),semester:semesters(name_ar,is_active)),grade:grade_entries(total,letter,is_published),attendance:attendance(status)').eq('student_id',student.id).eq('status','enrolled');
    enrollments=enrData??[];
    if(enrollments.length>0){
      const {data:stats}=await supabase.from('lms_section_stats').select('*').eq('student_id',student.id);
      lmsStats=stats??[];
    }
    const {data:inv}=await supabase.from('invoices').select('balance,status,due_date,invoice_no').eq('student_id',student.id).in('status',['pending','partial','overdue']).order('due_date',{ascending:true}).limit(3);
    invoices=inv??[];
    const sectionIds=enrollments.map((e:any)=>e.section?.id).filter(Boolean);
    if(sectionIds.length>0){
      const {data:live}=await supabase.from('lms_live_sessions').select('id,title,scheduled_at,duration_min,platform,meeting_url,section_id').in('section_id',sectionIds).eq('status','scheduled').gte('scheduled_at',new Date().toISOString()).order('scheduled_at').limit(3);
      upcomingLive=live??[];
    }
  }
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="لوحتي">
      <StudentDashboardClient user={user} student={student} enrollments={enrollments} lmsStats={lmsStats} invoices={invoices} upcomingLive={upcomingLive}/>
    </DashboardShell>
  );
}
