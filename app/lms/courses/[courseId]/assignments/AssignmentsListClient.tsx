'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { ClipboardList, Clock, CheckCircle2, AlertCircle, ChevronRight, Upload } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/shared';
import { fDate, fDateTime, cn } from '@/lib/utils';

interface Props {
  assignments: any[];
  submissions: any[];
  courseId:    string;
  section:     any;
  isStudent:   boolean;
}

const SUB_STATUS: Record<string, { label: string; badge: string }> = {
  draft:     { label: 'مسودة',          badge: 'badge-gray' },
  submitted: { label: 'تم التسليم',     badge: 'badge-blue' },
  graded:    { label: 'مصحّح',          badge: 'badge-green' },
  returned:  { label: 'مُعاد للمراجعة', badge: 'badge-yellow' },
};

const TYPE_AR: Record<string, string> = {
  upload: 'رفع ملف', text: 'نص', url: 'رابط', peer_review: 'مراجعة الأقران',
};

export function AssignmentsListClient({ assignments, submissions, courseId, section, isStudent }: Props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const courseName = isRTL ? section.course?.name_ar : section.course?.name_en;

  const getSub = (assignId: string) =>
    submissions.find(s => s.assignment_id === assignId);

  const now = new Date();

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="الواجبات"
        description={`${courseName} • ${assignments.length} واجب`}
        breadcrumbs={[
          { label: 'مقرراتي', href: '/lms/my-courses' },
          { label: courseName, href: `/lms/courses/${courseId}` },
          { label: 'الواجبات' },
        ]}
      />

      {/* Summary for students */}
      {isStudent && assignments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { l: 'المجموع',    n: assignments.length,                                           c: 'text-gray-700' },
            { l: 'مسلّم',     n: submissions.filter(s=>['submitted','graded'].includes(s.status)).length, c: 'text-green-600' },
            { l: 'لم يُسلَّم', n: assignments.filter(a => !getSub(a.id)).length,                c: 'text-red-500' },
          ].map(s => (
            <div key={s.l} className="card p-3 text-center">
              <p className={cn('text-xl font-bold', s.c)}>{s.n}</p>
              <p className="text-xs text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      {assignments.length === 0 ? (
        <EmptyState icon={ClipboardList} title="لا توجد واجبات" description="لم يضف الأستاذ واجبات بعد" />
      ) : (
        <div className="space-y-3">
          {assignments.map(assign => {
            const sub     = getSub(assign.id);
            const isDue   = assign.due_date && new Date(assign.due_date) < now;
            const isLate  = isDue && !assign.allow_late && !sub;
            const name    = isRTL ? (assign.title_ar ?? assign.title) : assign.title;

            return (
              <Link key={assign.id}
                href={`/lms/courses/${courseId}/assignments/${assign.id}`}
                className={cn('card p-5 block hover:shadow-elevated transition-shadow group',
                  isDue && !sub && 'border-red-200'
                )}>
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                    sub?.status === 'graded'    ? 'bg-green-100'
                    : sub?.status === 'submitted' ? 'bg-blue-100'
                    : isDue ? 'bg-red-100' : 'bg-gray-100'
                  )}>
                    {sub?.status === 'graded'
                      ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                      : isDue && !sub
                      ? <AlertCircle className="w-5 h-5 text-red-500" />
                      : <ClipboardList className="w-5 h-5 text-gray-400" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                      <span>{assign.max_score} نقطة</span>
                      <span>{TYPE_AR[assign.type]}</span>
                      {assign.due_date && (
                        <span className={cn('flex items-center gap-0.5', isDue ? 'text-red-500 font-medium' : '')}>
                          <Clock className="w-3 h-3" />
                          {isDue ? 'انتهى: ' : 'الموعد: '}
                          {fDate(assign.due_date, isRTL ? 'ar' : 'en')}
                        </span>
                      )}
                    </div>

                    {/* Submission status */}
                    {isStudent && sub && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn('badge text-xs', SUB_STATUS[sub.status]?.badge)}>
                          {SUB_STATUS[sub.status]?.label}
                        </span>
                        {sub.score != null && (
                          <span className="text-xs font-bold text-green-600">
                            {sub.score}/{assign.max_score} نقطة
                          </span>
                        )}
                      </div>
                    )}
                    {isStudent && !sub && !isLate && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-primary-500">
                        <Upload className="w-3.5 h-3.5" />
                        اضغط للتسليم
                      </div>
                    )}
                    {isLate && (
                      <span className="badge-red badge text-xs mt-2 inline-flex">انتهى الموعد</span>
                    )}
                  </div>

                  <ChevronRight className={cn('w-4 h-4 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0 mt-1', isRTL && 'rotate-180')} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
