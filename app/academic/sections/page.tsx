import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { SectionsClient } from './SectionsClient';
export const metadata = { title: 'إدارة الشعب' };
export default async function SectionsPage() {
  const user=await requireRole(['platform_admin','university_admin','registrar','dean','department_head']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const [{data:sections},{data:semesters},{data:courses}]=await Promise.all([
    supabase.from('sections').select('*,course:courses(code,name_ar,name_en,credits),semester:semesters(name_ar,name_en,is_active),professor:profiles(full_name,full_name_ar)').order('created_at',{ascending:false}),
    supabase.from('semesters').select('id,name_ar,name_en,is_active').order('created_at',{ascending:false}),
    supabase.from('courses').select('id,code,name_ar,name_en,credits').eq('is_active',true).order('code'),
  ]);
  const {data:profRoles}=await supabase.from('user_roles').select('user_id').in('role',['professor','teaching_assistant']);
  const {data:professors}=await supabase.from('profiles').select('id,full_name,full_name_ar').in('id',(profRoles??[]).map((r:any)=>r.user_id));
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="إدارة الشعب">
      <SectionsClient sections={sections??[]} semesters={semesters??[]} courses={courses??[]} professors={professors??[]} adminId={user.id}/>
    </DashboardShell>
  );
}
