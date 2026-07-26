import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { JoinRequestsClient } from './JoinRequestsClient';
export const metadata = { title: 'طلبات الانضمام' };
export default async function JoinRequestsPage() {
  const user=await requireRole(['platform_admin','university_admin']); const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:requests}=await supabase.from('join_requests').select('*,user:profiles(id,full_name,full_name_ar,email,avatar_url),department:departments(name_ar)').order('created_at',{ascending:false});
  return (<DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="طلبات الانضمام"><JoinRequestsClient requests={requests??[]} adminId={user.id}/></DashboardShell>);
}
