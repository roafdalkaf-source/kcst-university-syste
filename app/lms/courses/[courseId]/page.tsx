import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CourseShell } from './CourseShell';
export async function generateMetadata({ params }: { params: { courseId: string } }) {
  const supabase=createClient();
  const {data}=await supabase.from('sections').select('course:courses(name_ar,name_en)').eq('id',params.courseId).single();
  return { title: (data as any)?.course?.name_ar??'المقرر' };
}
export default async function CoursePage({ params }: { params: { courseId: string } }) {
  const user=await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin','registrar']);
  const supabase=createClient();
  const {data:section}=await supabase.from('sections').select('id,code,room,status,enrolled_count,capacity,course:courses(id,code,name_ar,name_en,credits,description),semester:semesters(id,name_ar,name_en,is_active),professor:profiles(id,full_name,full_name_ar,avatar_url)').eq('id',params.courseId).single();
  if(!section) notFound();
  let enrollment:any=null;
  if(user.roles.includes('student')){
    const {data:student}=await supabase.from('students').select('id').eq('profile_id',user.id).single();
    if(student){const {data}=await supabase.from('enrollments').select('id,status').eq('student_id',student.id).eq('section_id',params.courseId).single();enrollment=data;if(!enrollment)notFound();}
  }
  const [{data:lessons},{data:assignments},{data:quizzes},{data:live},{data:resources},{data:announcements}]=await Promise.all([
    supabase.from('lms_lessons').select('*').eq('section_id',params.courseId).eq('is_published',true).order('order_index'),
    supabase.from('lms_assignments').select('*').eq('section_id',params.courseId).eq('is_published',true).order('order_index'),
    supabase.from('lms_quizzes').select('*').eq('section_id',params.courseId).eq('is_published',true).order('order_index'),
    supabase.from('lms_live_sessions').select('*').eq('section_id',params.courseId).order('scheduled_at'),
    supabase.from('lms_resources').select('*').eq('section_id',params.courseId).order('order_index'),
    supabase.from('lms_announcements').select('*,author:profiles(full_name,full_name_ar)').eq('section_id',params.courseId).order('is_pinned',{ascending:false}).order('created_at',{ascending:false}),
  ]);
  let progress:any[]=[];
  if(enrollment){const {data}=await supabase.from('lms_progress').select('*').eq('enrollment_id',enrollment.id);progress=data??[];}
  const outline={lessons:lessons??[],assignments:assignments??[],quizzes:quizzes??[],live_sessions:live??[],resources:resources??[],announcements:announcements??[]};
  return <CourseShell user={user} section={section as any} enrollment={enrollment} outline={outline} progress={progress}/>;
}
