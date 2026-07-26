import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { LiveSessionsClient } from './LiveSessionsClient';
export default async function LiveSessionsPage({ params }: { params: { courseId: string } }) {
  const user=await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const supabase=createClient();
  const {data:section}=await supabase.from('sections').select('id,professor_id,course:courses(name_ar,name_en)').eq('id',params.courseId).single();
  if(!section) notFound();
  const {data:sessions}=await supabase.from('lms_live_sessions').select('*').eq('section_id',params.courseId).order('scheduled_at',{ascending:false});
  const isProfessor=user.roles.some((r:any)=>['professor','teaching_assistant','platform_admin','university_admin'].includes(r))&&((section as any).professor_id===user.id||['platform_admin','university_admin'].some((r:any)=>user.roles.includes(r)));
  return <LiveSessionsClient sessions={sessions??[]} courseId={params.courseId} userId={user.id} isProfessor={isProfessor} section={section}/>;
}
