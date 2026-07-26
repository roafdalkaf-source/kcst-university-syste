import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminDashboardClient } from './AdminDashboardClient';
export const metadata = { title: 'لوحة التحكم' };
export default async function AdminDashboardPage() {
  const user=await requireRole(['platform_admin','university_admin','dean','department_head','registrar']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const [{count:ts},{count:as},{count:tf},{count:os},{data:inv},{data:gpa},{count:pr}]=await Promise.all([
    supabase.from('students').select('*',{count:'exact',head:true}),
    supabase.from('students').select('*',{count:'exact',head:true}).eq('status','active'),
    supabase.from('faculties').select('*',{count:'exact',head:true}).eq('is_active',true),
    supabase.from('sections').select('*',{count:'exact',head:true}).eq('status','open'),
    supabase.from('invoices').select('paid_amount,status'),
    supabase.from('students').select('gpa').eq('status','active'),
    supabase.from('join_requests').select('*',{count:'exact',head:true}).eq('status','pending'),
  ]);
  const totalRevenue=(inv??[]).reduce((s:number,i:any)=>s+(i.paid_amount??0),0);
  const pendingCount=(inv??[]).filter((i:any)=>['pending','partial','overdue'].includes(i.status??'')).length;
  const avgGpa=(gpa?.length??0)>0?(gpa??[]).reduce((s:number,st:any)=>s+(st.gpa??0),0)/(gpa?.length??1):0;
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="لوحة التحكم">
      <AdminDashboardClient user={user} stats={{totalStudents:ts??0,activeStudents:as??0,totalFaculties:tf??0,openSections:os??0,pendingInvoices:pendingCount,totalRevenue,avgGpa:Math.round(avgGpa*100)/100,pendingRequests:pr??0}}/>
    </DashboardShell>
  );
}
