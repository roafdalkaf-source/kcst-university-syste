import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { UsersClient } from './UsersClient';
export const metadata = { title: 'إدارة المستخدمين' };
export default async function UsersPage() {
  const user=await requireRole(['platform_admin','university_admin']); const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const [{data:profiles},{data:allRoles}]=await Promise.all([supabase.from('profiles').select('*').order('created_at',{ascending:false}),supabase.from('user_roles').select('user_id,role')]);
  const users=(profiles??[]).map((p:any)=>({...p,roles:(allRoles??[]).filter((r:any)=>r.user_id===p.id).map((r:any)=>r.role)}));
  return (<DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="المستخدمون"><UsersClient users={users} adminId={user.id}/></DashboardShell>);
}
