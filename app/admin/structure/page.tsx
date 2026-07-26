import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { StructureClient } from './StructureClient';
export const metadata = { title: 'الهيكل الأكاديمي' };
export default async function StructurePage() {
  const user=await requireRole(['platform_admin','university_admin']); const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:faculties}=await supabase.from('faculties').select('*,dean:profiles(full_name,full_name_ar),departments(*,head:profiles(full_name,full_name_ar),programs(id,code,name_ar,name_en,degree_level,total_credits,duration_years,is_active))').order('name_ar');
  return (<DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="الهيكل الأكاديمي"><StructureClient faculties={faculties??[]} adminId={user.id}/></DashboardShell>);
}
