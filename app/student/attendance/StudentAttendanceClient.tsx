'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, Clock, MinusCircle, CalendarDays, AlertTriangle } from 'lucide-react';
import { PageHeader, ProgressBar } from '@/components/shared';
import { calcAttendance, fDate, cn } from '@/lib/utils';

const STATUS_CFG = {
  present: { icon:CheckCircle2, label:'حاضر',   cls:'text-green-600 bg-green-50 border-green-200' },
  absent:  { icon:XCircle,      label:'غائب',    cls:'text-red-500   bg-red-50   border-red-200' },
  late:    { icon:Clock,        label:'متأخر',   cls:'text-amber-600 bg-amber-50 border-amber-200' },
  excused: { icon:MinusCircle,  label:'معذور',   cls:'text-blue-500  bg-blue-50  border-blue-200' },
};

export function StudentAttendanceClient({ enrollments }: { enrollments: any[] }) {
  const { i18n } = useTranslation(); const isRTL = i18n.language === 'ar';
  const [selected, setSelected] = useState<string>(enrollments[0]?.section?.id ?? '');

  const enr         = enrollments.find(e => e.section?.id === selected) ?? enrollments[0];
  const records     = enr?.attendance ?? [];
  const att         = calcAttendance(records);
  const course      = enr?.section?.course;
  const courseName  = isRTL ? course?.name_ar : course?.name_en;

  return (
    <div className="space-y-5 animate-fade-up max-w-2xl">
      <PageHeader title="سجل الحضور" breadcrumbs={[{label:'أكاديمي'},{label:'حضوري'}]}/>

      {/* Course selector */}
      {enrollments.length > 1 && (
        <select value={selected} onChange={e=>setSelected(e.target.value)} className="input text-sm max-w-xs">
          {enrollments.map(e=>(
            <option key={e.section?.id} value={e.section?.id}>
              {isRTL?e.section?.course?.name_ar:e.section?.course?.name_en}
            </option>
          ))}
        </select>
      )}

      {/* Summary card */}
      <div className={cn('card p-5 border-2',
        att.isDebarred   ? 'border-red-300   bg-red-50/30' :
        att.isAtRisk     ? 'border-amber-300 bg-amber-50/30' :
                           'border-border-subtle'
      )}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <p className="text-xs text-text-muted mb-0.5">{courseName}</p>
            <h3 className="text-3xl font-black"
              style={{ color: att.isDebarred ? '#DC2626' : att.isAtRisk ? '#D97706' : '#16A34A' }}>
              {att.rate}%
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              {att.attended} حضور من {att.total} محاضرة
            </p>
          </div>
          <div className="space-y-2 min-w-[140px]">
            {Object.entries({ present: att.attended, absent: att.absent, late: att.late, excused: att.excused })
              .map(([s, n]) => {
                const cfg = STATUS_CFG[s as keyof typeof STATUS_CFG];
                return (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <cfg.icon className={cn('w-3.5 h-3.5', cfg.cls.split(' ')[0])}/>
                    <span className="text-text-muted">{cfg.label}</span>
                    <span className="font-bold text-text-primary ms-auto">{n}</span>
                  </div>
                );
              })}
          </div>
        </div>
        <ProgressBar value={att.rate} variant={att.isDebarred ? 'primary' : att.isAtRisk ? 'accent' : 'success'} showLabel/>
        {att.isAtRisk && (
          <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0"/>
            تحذير: نسبة حضورك أقل من 75%. تحسّن وإلا ستُحرم من الاختبار.
          </div>
        )}
      </div>

      {/* Records list */}
      {records.length === 0 ? (
        <div className="card p-10 text-center">
          <CalendarDays className="w-10 h-10 text-border-subtle mx-auto mb-3"/>
          <p className="text-sm text-text-muted">لا توجد سجلات حضور بعد</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-border-subtle bg-surface-raised">
            <p className="text-xs font-bold text-text-muted uppercase tracking-wider">سجل المحاضرات</p>
          </div>
          <div className="divide-y divide-border-subtle/50">
            {records.sort((a:any,b:any)=>new Date(b.date).getTime()-new Date(a.date).getTime()).map((r:any) => {
              const cfg = STATUS_CFG[r.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.absent;
              return (
                <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold shrink-0 min-w-[80px] justify-center', cfg.cls)}>
                    <cfg.icon className="w-3.5 h-3.5"/>
                    {cfg.label}
                  </div>
                  <span className="text-sm text-text-primary">{fDate(r.date, isRTL?'ar':'en')}</span>
                  {r.notes && <span className="text-xs text-text-muted ms-auto truncate max-w-[180px]">{r.notes}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
