import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { FinanceDashboardClient } from './FinanceDashboardClient';
export const metadata = { title: 'لوحة المالية' };
export default async function FinanceDashboardPage() {
  const user=await requireRole(['finance_officer']); const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const [{data:recentInvoices},{data:recentPayments},{count:pendingCount},{count:overdueCount}]=await Promise.all([
    supabase.from('invoices').select('*,student:students(student_number,profile:profiles(full_name,full_name_ar))').order('created_at',{ascending:false}).limit(10),
    supabase.from('payments').select('*,invoice:invoices(invoice_no,student:students(profile:profiles(full_name,full_name_ar)))').order('paid_at',{ascending:false}).limit(10),
    supabase.from('invoices').select('*',{count:'exact',head:true}).in('status',['pending','partial']),
    supabase.from('invoices').select('*',{count:'exact',head:true}).eq('status','overdue'),
  ]);
  const todayRevenue=(recentPayments??[]).filter((p:any)=>new Date(p.paid_at).toDateString()===new Date().toDateString()).reduce((s:number,p:any)=>s+(p.amount??0),0);
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="لوحة المالية">
      <FinanceDashboardClient recentInvoices={recentInvoices??[]} recentPayments={recentPayments??[]} pendingCount={pendingCount??0} overdueCount={overdueCount??0} todayRevenue={todayRevenue}/>
    </DashboardShell>
  );
}
