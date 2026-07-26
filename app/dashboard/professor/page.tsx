import { requireRole, getBranding, getUnreadCount } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/layout/DashboardShell';
import Link from 'next/link';
import { Users, Video, ClipboardList, PlayCircle, BookOpen } from 'lucide-react';
import { StatCard, PageHeader } from '@/components/shared';
export const metadata = { title: 'لوحة الأستاذ' };
export default async function ProfessorDashboardPage() {
  const user=await requireRole(['professor','teaching_assistant']); const branding=await getBranding(); const unread=await getUnreadCount(user.id);
  const supabase=createClient();
  const {data:sections}=await supabase.from('sections').select('id,code,enrolled_count,capacity,status,course:courses(name_ar,name_en,code,credits),semester:semesters(name_ar,name_en,is_active)').eq('professor_id',user.id).eq('status','open').order('created_at',{ascending:false});
  const sectionIds=(sections??[]).map((s:any)=>s.id);
  const {count:totalStudents}=await supabase.from('enrollments').select('*',{count:'exact',head:true}).in('section_id',sectionIds).eq('status','enrolled');
  const {data:upcomingLive}=await supabase.from('lms_live_sessions').select('*').in('section_id',sectionIds).eq('status','scheduled').gte('scheduled_at',new Date().toISOString()).order('scheduled_at').limit(3);
  const name=user.full_name_ar??user.full_name;
  return (
    <DashboardShell user={user} branding={branding} unreadCount={unread} pageTitle="لوحة الأستاذ">
      <div className="space-y-6 animate-fade-in">
        <PageHeader title={`مرحباً د. ${name}`} description={`لديك ${sections?.length??0} شعبة نشطة هذا الفصل`}/>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="إجمالي الطلاب" value={totalStudents??0} icon={Users} iconClass="text-blue-600"/>
          <StatCard title="شعبي النشطة" value={sections?.length??0} icon={BookOpen} iconClass="text-purple-600"/>
          <StatCard title="مقرراتي" value="←" icon={Video} iconClass="text-green-600" href="/lms/my-courses"/>
          <StatCard title="جلسات قادمة" value={upcomingLive?.length??0} icon={PlayCircle} iconClass="text-amber-500"/>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">شعبي هذا الفصل</h3>
            <Link href="/lms/my-courses" className="text-xs text-primary-500 hover:underline">عرض LMS</Link>
          </div>
          {(sections??[]).length===0?<p className="text-sm text-gray-400 text-center py-6">لا توجد شعب نشطة</p>:(
            <div className="space-y-2">
              {(sections??[]).map((sec:any)=>(
                <Link key={sec.id} href={`/professor/section/${sec.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0"><Video className="w-4 h-4 text-primary-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{sec.course?.name_ar}</p>
                    <p className="text-xs text-gray-500">{sec.course?.code} • الشعبة {sec.code} • {sec.enrolled_count}/{sec.capacity} طالب</p>
                  </div>
                  <span className="text-xs text-gray-400 group-hover:text-primary-500 transition-colors">إدارة →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        {(upcomingLive??[]).length>0 && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-3">جلساتي المباشرة القادمة</h3>
            <div className="space-y-2">
              {(upcomingLive??[]).map((sess:any)=>(
                <div key={sess.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <PlayCircle className="w-4 h-4 text-amber-600 shrink-0"/>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{sess.title}</p><p className="text-xs text-gray-500">{new Date(sess.scheduled_at).toLocaleString('ar-SA')}</p></div>
                  {sess.meeting_url&&<a href={sess.meeting_url} target="_blank" rel="noopener noreferrer" className="text-xs text-amber-700 font-semibold hover:underline">فتح</a>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
