import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StudentsClient } from './StudentsClient';
export const metadata = { title: 'إدارة الطلاب' };
export default async function StudentsPage() {
  const user=await requireRole(['platform_admin','university_admin','registrar','dean','department_head']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:students}=await supabase.from('students').select('*,profile:profiles(id,full_name,full_name_ar,email,avatar_url,phone),program:programs(name_ar,name_en,degree_level,department:departments(name_ar,faculty:faculties(name_ar)))').order('created_at',{ascending:false});
  const {data:programs}=await supabase.from('programs').select('id,name_ar,name_en,degree_level').eq('is_active',true).order('name_ar');
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="إدارة الطلاب">
      <StudentsClient students={students??[]} programs={programs??[]} adminId={user.id}/>
    </DashboardShell>
  );
}
