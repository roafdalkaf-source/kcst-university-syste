import { requireRole, getUnreadCount, getBranding } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { NotificationsClient } from './NotificationsClient';
export const metadata = { title: 'الإشعارات' };
export default async function NotificationsPage() {
  const user=await requireRole(['platform_admin','university_admin','dean','department_head','professor','teaching_assistant','registrar','finance_officer','student']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:notifications}=await supabase.from('notifications').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="الإشعارات">
      <NotificationsClient notifications={notifications??[]} userId={user.id}/>
    </DashboardShell>
  );
}
