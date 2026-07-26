import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { DiscussionsClient } from './DiscussionsClient';
export default async function DiscussionsPage({ params }: { params: { courseId: string } }) {
  const user=await requireRole(['student','professor','teaching_assistant','platform_admin','university_admin']);
  const supabase=createClient();
  const {data:section}=await supabase.from('sections').select('id,course:courses(name_ar,name_en)').eq('id',params.courseId).single();
  if(!section) notFound();
  const {data:discussions}=await supabase.from('lms_discussions').select('*,author:profiles(id,full_name,full_name_ar,avatar_url)').eq('section_id',params.courseId).order('is_pinned',{ascending:false}).order('created_at',{ascending:false});
  return <DiscussionsClient discussions={discussions??[]} courseId={params.courseId} userId={user.id} userName={user.full_name} section={section}/>;
}
