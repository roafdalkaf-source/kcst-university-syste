import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { FinanceClient } from './FinanceClient';
export const metadata = { title: 'إدارة المالية' };
export default async function FinancePage() {
  const user=await requireRole(['platform_admin','university_admin','finance_officer']);
  const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:invoices}=await supabase.from('invoices').select('*,student:students(student_number,profile:profiles(full_name,full_name_ar,email)),semester:semesters(name_ar,name_en),payments(id,amount,method,paid_at,reference_no)').order('created_at',{ascending:false}).limit(200);
  const totalRevenue=(invoices??[]).reduce((s:number,i:any)=>s+(i.paid_amount??0),0);
  const totalPending=(invoices??[]).reduce((s:number,i:any)=>s+(i.balance??0),0);
  const overdueCount=(invoices??[]).filter((i:any)=>i.status==='overdue').length;
  const paidCount=(invoices??[]).filter((i:any)=>i.status==='paid').length;
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="إدارة المالية">
      <FinanceClient invoices={invoices??[]} stats={{totalRevenue,totalPending,overdueCount,paidCount}} userId={user.id}/>
    </DashboardShell>
  );
}
