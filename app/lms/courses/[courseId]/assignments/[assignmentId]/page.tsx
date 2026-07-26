import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { AssignmentClient } from './AssignmentClient';
export default async function AssignmentPage({ params }: { params: { courseId: string; assignmentId: string } }) {
  const user=await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const supabase=createClient();
  const {data:assignment}=await supabase.from('lms_assignments').select('*').eq('id',params.assignmentId).eq('section_id',params.courseId).single();
  if(!assignment) notFound();
  const isStudent=user.roles.includes('student');
  let enrollmentId:string|null=null; let mySubmission:any=null; let allSubmissions:any[]=[];
  if(isStudent){
    const {data:student}=await supabase.from('students').select('id').eq('profile_id',user.id).single();
    if(student){const {data:enr}=await supabase.from('enrollments').select('id').eq('student_id',student.id).eq('section_id',params.courseId).single();enrollmentId=enr?.id??null;if(enrollmentId){const {data:sub}=await supabase.from('lms_submissions').select('*').eq('assignment_id',params.assignmentId).eq('enrollment_id',enrollmentId).order('attempt',{ascending:false}).limit(1).single();mySubmission=sub;}}
  } else {
    const {data:subs}=await supabase.from('lms_submissions').select('*,enrollment:enrollments(student:students(student_number,profile:profiles(full_name,full_name_ar,email)))').eq('assignment_id',params.assignmentId).order('submitted_at',{ascending:false});allSubmissions=subs??[];
  }
  return <AssignmentClient assignment={assignment} enrollmentId={enrollmentId} mySubmission={mySubmission} allSubmissions={allSubmissions} courseId={params.courseId} userId={user.id} isStudent={isStudent}/>;
}
