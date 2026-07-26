import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ImportClient } from './ImportClient';
export const metadata = { title: 'استيراد البيانات' };
export default async function ImportPage() {
  const user=await requireRole(['platform_admin','university_admin','registrar']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:programs}=await supabase.from('programs').select('id,code,name_ar,name_en,degree_level').eq('is_active',true).order('name_ar');
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="استيراد البيانات">
      <ImportClient programs={programs??[]}/>
    </DashboardShell>
  );
}
