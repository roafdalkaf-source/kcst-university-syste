'use client';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/shared';
import { Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS_AR = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس'];
const DAYS_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday'];
const HOURS   = Array.from({length:10},(_,i)=>i+8); // 8am-5pm
const COLORS  = ['bg-blue-100 border-blue-300 text-blue-800','bg-purple-100 border-purple-300 text-purple-800','bg-green-100 border-green-300 text-green-800','bg-amber-100 border-amber-300 text-amber-800','bg-rose-100 border-rose-300 text-rose-800','bg-cyan-100 border-cyan-300 text-cyan-800'];

export function StudentScheduleClient({ enrollments }: { enrollments: any[] }) {
  const { i18n } = useTranslation(); const isRTL = i18n.language === 'ar';

  // Build schedule grid
  const scheduled: Record<string, Record<number, any>> = {};
  DAYS_AR.forEach(d=>{ scheduled[d]={}; });

  enrollments.forEach((enr,i)=>{
    const sched:any[] = enr.section?.schedule??[];
    const course = enr.section?.course;
    const name   = isRTL?course?.name_ar:course?.name_en;
    const color  = COLORS[i%COLORS.length];
    sched.forEach((s:any)=>{
      const day = isRTL ? s.day_ar ?? s.day : s.day;
      if(scheduled[day]){
        const hour = parseInt(s.start?.split(':')[0]??'8');
        scheduled[day][hour]={ name, code:course?.code, room:enr.section?.room, start:s.start, end:s.end, color };
      }
    });
  });

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="جدولي الأسبوعي" breadcrumbs={[{label:'أكاديمي'},{label:'الجدول'}]}/>

      {/* Desktop grid */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-surface-raised">
                <th className="p-3 border-e border-border-subtle w-14 text-text-muted font-semibold">وقت</th>
                {(isRTL?DAYS_AR:DAYS_EN).map(d=>(
                  <th key={d} className="p-3 text-center border-e border-border-subtle font-bold text-text-primary">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(h=>(
                <tr key={h} className="border-t border-border-subtle/50">
                  <td className="p-2 border-e border-border-subtle text-center text-text-muted font-mono">
                    {h}:00
                  </td>
                  {DAYS_AR.map(day=>{
                    const slot = scheduled[day]?.[h];
                    return (
                      <td key={day} className="p-1 border-e border-border-subtle/50 align-top h-14">
                        {slot&&(
                          <div className={cn('rounded-lg p-2 border h-full flex flex-col justify-between', slot.color)}>
                            <p className="font-bold leading-tight line-clamp-2 text-[11px]">{slot.name}</p>
                            <div className="flex items-center gap-1 text-[9px] opacity-70 mt-1">
                              {slot.room&&<><MapPin className="w-2.5 h-2.5 shrink-0"/><span>{slot.room}</span></>}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile list */}
      <div className="md:hidden space-y-3">
        {DAYS_AR.map(day=>{
          const slots = Object.entries(scheduled[day]??{});
          if(slots.length===0) return null;
          return(
            <div key={day} className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-primary-50 border-b border-primary-100">
                <p className="text-sm font-bold text-primary-700">{day}</p>
              </div>
              <div className="divide-y divide-border-subtle/50">
                {slots.map(([h,slot]:[string,any])=>(
                  <div key={h} className="flex items-center gap-3 p-3">
                    <div className={cn('w-1.5 rounded-full self-stretch', slot.color.split(' ')[0].replace('bg-','bg-'))}/>
                    <div className="flex items-center gap-1.5 text-xs text-text-muted shrink-0">
                      <Clock className="w-3 h-3"/>
                      {slot.start}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-text-primary truncate">{slot.name}</p>
                      {slot.room&&<p className="text-xs text-text-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/>{slot.room}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {Object.values(scheduled).every(d=>Object.keys(d).length===0)&&(
          <div className="card p-10 text-center">
            <Clock className="w-10 h-10 text-border-subtle mx-auto mb-3"/>
            <p className="text-sm text-text-muted">لا توجد محاضرات مجدولة</p>
          </div>
        )}
      </div>
    </div>
  );
}
