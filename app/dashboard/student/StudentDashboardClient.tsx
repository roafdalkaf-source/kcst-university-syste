'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { TrendingUp, BookOpen, CheckCircle2, DollarSign, AlertTriangle, PlayCircle, Clock } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import { StatCard, PageHeader, GPABadge } from '@/components/shared';
import { fCurrency, fDate, fDateTime, cn, calcAttendance } from '@/lib/utils';
import type { UserWithRoles } from '@/types';

export function StudentDashboardClient({ user, student, enrollments, lmsStats, invoices, upcomingLive }: any) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language==='ar';
  const name = isRTL?(user.full_name_ar??user.full_name):user.full_name;
  if (!student) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AlertTriangle className="w-12 h-12 text-amber-500 mb-4"/>
      <h2 className="text-lg font-bold text-gray-800">ملفك كطالب غير مكتمل</h2>
      <p className="text-sm text-gray-500 mt-1">تواصل مع المسجل الأكاديمي لاستكمال بياناتك</p>
    </div>
  );
  const allAtt=enrollments.flatMap((e:any)=>e.attendance??[]);
  const attStats=calcAttendance(allAtt);
  const totalBalance=(invoices??[]).reduce((s:number,i:any)=>s+(i.balance??0),0);
  const gpaData=[{name:'GPA',value:Math.round((student.gpa/4)*100)}];
  const getLmsStats=(sid:string)=>lmsStats.find((s:any)=>s.section_id===sid);
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={`أهلاً، ${name} 👋`} description={`${isRTL?student.program?.name_ar:student.program?.name_en} • المستوى ${student.current_level} • ${student.student_number}`}/>
      {upcomingLive.length>0 && (
        <div className="card p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0"><PlayCircle className="w-5 h-5 text-amber-300"/></div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-white/60 uppercase tracking-wider">جلسة مباشرة قادمة</p>
            <p className="text-sm font-bold truncate">{upcomingLive[0].title}</p>
            <p className="text-xs text-white/60">{fDateTime(upcomingLive[0].scheduled_at,isRTL?'ar':'en')}</p>
          </div>
          {upcomingLive[0].meeting_url && (
            <a href={upcomingLive[0].meeting_url} target="_blank" rel="noopener noreferrer" className="btn bg-amber-400 text-gray-900 text-xs py-1.5 px-3 shrink-0 hover:bg-amber-300">انضم الآن</a>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="المعدل التراكمي" value={student.gpa.toFixed(2)} icon={TrendingUp} iconClass={student.gpa>=3?'text-green-600':student.gpa>=2?'text-yellow-600':'text-red-500'} href="/student/grades"/>
        <StatCard title="مقرراتي" value={enrollments.length} icon={BookOpen} iconClass="text-blue-600" href="/lms/my-courses"/>
        <StatCard title="نسبة الحضور" value={`${attStats.rate}%`} icon={CheckCircle2} iconClass={attStats.isDebarred?'text-red-500':attStats.isAtRisk?'text-amber-500':'text-green-600'} description={attStats.isAtRisk?'⚠️ خطر الحرمان':undefined}/>
        <StatCard title="الرصيد المستحق" value={fCurrency(totalBalance)} icon={DollarSign} iconClass={totalBalance>0?'text-red-500':'text-green-600'} href="/student/finance"/>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 flex flex-col items-center">
          <h3 className="text-sm font-bold text-gray-800 mb-2 self-start">المعدل التراكمي</h3>
          <ResponsiveContainer width={160} height={160}>
            <RadialBarChart cx="50%" cy="50%" innerRadius={50} outerRadius={75} data={gpaData} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={8} background={{fill:'#F3F4F6'}} fill={student.gpa>=3.7?'#16A34A':student.gpa>=2?'#0284C7':'#DC2626'}/>
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="text-center -mt-4"><GPABadge gpa={student.gpa}/><p className="text-[10px] text-gray-400 mt-1">من 4.00</p></div>
        </div>
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-800">مقرراتي الحالية</h3>
            <Link href="/lms/my-courses" className="text-xs text-primary-500 hover:underline">عرض الكل</Link>
          </div>
          <div className="space-y-3">
            {enrollments.length===0 && <p className="text-sm text-gray-400 text-center py-4">لا توجد مقررات مسجّلة</p>}
            {enrollments.map((enr:any)=>{
              const course=enr.section?.course; const grade=enr.grade?.[0];
              const lms=getLmsStats(enr.section?.id); const pct=lms?.lesson_completion_pct??0;
              return (
                <Link key={enr.id} href={`/lms/courses/${enr.section?.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0"><BookOpen className="w-4 h-4 text-primary-600"/></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{isRTL?course?.name_ar:course?.name_en}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full" style={{width:`${pct}%`}}/></div>
                      <span className="text-[10px] text-gray-400 shrink-0">{pct}%</span>
                    </div>
                  </div>
                  <div className="text-end shrink-0">
                    {grade?.is_published&&grade.letter?<span className="text-sm font-bold text-green-600">{grade.letter}</span>:<span className="text-xs text-gray-400">—</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800">الفواتير المستحقة</h3>
            <Link href="/student/finance" className="text-xs text-primary-500 hover:underline">الكل</Link>
          </div>
          {invoices.length===0
            ?<div className="flex items-center gap-2 text-sm text-green-600 py-2"><CheckCircle2 className="w-4 h-4"/>حسابك خالٍ من الديون</div>
            :<div className="space-y-2">{invoices.map((inv:any)=>(
              <div key={inv.invoice_no} className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 border border-red-100">
                <div><p className="text-xs font-mono font-medium text-gray-700">{inv.invoice_no}</p>{inv.due_date&&<p className="text-[10px] text-gray-400"><Clock className="w-2.5 h-2.5 inline me-0.5"/>{fDate(inv.due_date,isRTL?'ar':'en')}</p>}</div>
                <p className="text-sm font-bold text-red-600">{fCurrency(inv.balance)}</p>
              </div>
            ))}</div>
          }
        </div>
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-3">جلسات مباشرة قادمة</h3>
          {upcomingLive.length===0
            ?<p className="text-sm text-gray-400 py-2">لا توجد جلسات مجدولة</p>
            :<div className="space-y-2">{upcomingLive.map((sess:any)=>(
              <div key={sess.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <PlayCircle className="w-4 h-4 text-amber-600 shrink-0"/>
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-gray-800 truncate">{sess.title}</p><p className="text-[10px] text-gray-500">{fDateTime(sess.scheduled_at,isRTL?'ar':'en')}</p></div>
                {sess.meeting_url&&<a href={sess.meeting_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-amber-700 font-semibold hover:underline shrink-0">انضم</a>}
              </div>
            ))}</div>
          }
        </div>
      </div>
    </div>
  );
}
