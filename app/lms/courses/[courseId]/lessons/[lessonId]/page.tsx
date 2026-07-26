import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { LessonViewerClient } from './LessonViewerClient';
export default async function LessonPage({ params }: { params: { courseId: string; lessonId: string } }) {
  const user=await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin','registrar']);
  const supabase=createClient();
  const {data:lesson}=await supabase.from('lms_lessons').select('*').eq('id',params.lessonId).eq('section_id',params.courseId).single();
  if(!lesson) notFound();
  let enrollmentId:string|null=null; let progress:any=null;
  if(user.roles.includes('student')){
    const {data:student}=await supabase.from('students').select('id').eq('profile_id',user.id).single();
    if(student){const {data:enr}=await supabase.from('enrollments').select('id').eq('student_id',student.id).eq('section_id',params.courseId).single();enrollmentId=enr?.id??null;if(enrollmentId){const {data:prog}=await supabase.from('lms_progress').select('*').eq('enrollment_id',enrollmentId).eq('lesson_id',params.lessonId).single();progress=prog;}}
  }
  const {data:allLessons}=await supabase.from('lms_lessons').select('id,title,title_ar,order_index').eq('section_id',params.courseId).eq('is_published',true).order('order_index');
  const idx=(allLessons??[]).findIndex((l:any)=>l.id===params.lessonId);
  return <LessonViewerClient lesson={lesson} enrollmentId={enrollmentId} progress={progress} prevLesson={allLessons?.[idx-1]??null} nextLesson={allLessons?.[idx+1]??null} courseId={params.courseId} userId={user.id}/>;
}
