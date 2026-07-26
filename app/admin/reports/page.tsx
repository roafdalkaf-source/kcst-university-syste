import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { ReportsClient } from './ReportsClient';
export const metadata = { title: 'التقارير' };
export default async function ReportsPage() {
  const user=await requireRole(['platform_admin','university_admin']); const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const [{data:students},{data:grades},{data:invoices},{data:attendance}]=await Promise.all([
    supabase.from('students').select('status,gpa,current_level,created_at'),
    supabase.from('grade_entries').select('letter,is_published'),
    supabase.from('invoices').select('status,total_amount,paid_amount,balance'),
    supabase.from('attendance').select('status'),
  ]);
  const gradeDist=['A+','A','B+','B','C+','C','D+','D','F'].map(g=>({grade:g,count:(grades??[]).filter((x:any)=>x.letter===g).length}));
  const gpaBuckets=[{range:'3.7–4.0',min:3.7,max:4.01},{range:'3.0–3.7',min:3.0,max:3.7},{range:'2.0–3.0',min:2.0,max:3.0},{range:'1.0–2.0',min:1.0,max:2.0},{range:'0–1.0',min:0,max:1.0}].map(b=>({range:b.range,count:(students??[]).filter((s:any)=>(s.gpa??0)>=b.min&&(s.gpa??0)<b.max).length}));
  const byLevel=Array.from({length:8},(_,i)=>({level:`م${i+1}`,count:(students??[]).filter((s:any)=>s.current_level===i+1).length}));
  const totalRevenue=(invoices??[]).reduce((s:number,i:any)=>s+(i.paid_amount??0),0);
  const totalPending=(invoices??[]).reduce((s:number,i:any)=>s+(i.balance??0),0);
  const attTotal=(attendance??[]).length; const attPresent=(attendance??[]).filter((a:any)=>['present','late'].includes(a.status)).length;
  const attRate=attTotal>0?Math.round((attPresent/attTotal)*100):0;
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="التقارير">
      <ReportsClient students={students??[]} gradeDist={gradeDist} gpaBuckets={gpaBuckets} byLevel={byLevel} finance={{totalRevenue,totalPending}} attendanceRate={attRate}/>
    </DashboardShell>
  );
}
