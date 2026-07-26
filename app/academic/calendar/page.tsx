import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CalendarClient } from './CalendarClient';
export const metadata = { title: 'التقويم الأكاديمي' };
export default async function CalendarPage() {
  const user=await requireRole(['platform_admin','university_admin','registrar','dean']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:semesters}=await supabase.from('semesters').select('*').order('created_at',{ascending:false});
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="التقويم الأكاديمي">
      <CalendarClient semesters={semesters??[]} adminId={user.id}/>
    </DashboardShell>
  );
}
