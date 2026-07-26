import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { QuizClient } from './QuizClient';
export default async function QuizPage({ params }: { params: { courseId: string; quizId: string } }) {
  const user=await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const supabase=createClient();
  const {data:quiz}=await supabase.from('lms_quizzes').select('*,questions:lms_questions(*,answers:lms_answers(*))').eq('id',params.quizId).eq('section_id',params.courseId).single();
  if(!quiz) notFound();
  quiz.questions=(quiz.questions??[]).sort((a:any,b:any)=>a.order_index-b.order_index).map((q:any)=>({...q,answers:(q.answers??[]).sort((a:any,b:any)=>a.order_index-b.order_index)}));
  let enrollmentId:string|null=null; let existingAttempts:any[]=[];
  if(user.roles.includes('student')){
    const {data:student}=await supabase.from('students').select('id').eq('profile_id',user.id).single();
    if(student){const {data:enr}=await supabase.from('enrollments').select('id').eq('student_id',student.id).eq('section_id',params.courseId).single();enrollmentId=enr?.id??null;if(enrollmentId){const {data:att}=await supabase.from('lms_quiz_attempts').select('*').eq('quiz_id',params.quizId).eq('enrollment_id',enrollmentId).order('attempt_number');existingAttempts=att??[];}}
  }
  return <QuizClient quiz={quiz} enrollmentId={enrollmentId} existingAttempts={existingAttempts} courseId={params.courseId} userId={user.id} isProfessor={user.roles.some((r:any)=>['professor','teaching_assistant','platform_admin','university_admin'].includes(r))}/>;
}
