'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { HelpCircle, Clock, CheckCircle2, XCircle, ChevronRight, Lock } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/shared';
import { fDate, fDateTime, cn } from '@/lib/utils';

interface Props {
  quizzes:  any[];
  attempts: any[];
  courseId: string;
  section:  any;
}

export function QuizzesListClient({ quizzes, attempts, courseId, section }: Props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const courseName = isRTL ? section.course?.name_ar : section.course?.name_en;

  const getBestAttempt = (quizId: string) =>
    attempts.filter(a => a.quiz_id === quizId && a.status !== 'in_progress')
      .sort((a, b) => (b.percentage ?? 0) - (a.percentage ?? 0))[0];

  const getAttemptCount = (quizId: string) =>
    attempts.filter(a => a.quiz_id === quizId && a.status !== 'in_progress').length;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="الاختبارات"
        description={`${courseName} • ${quizzes.length} اختبار`}
        breadcrumbs={[
          { label: 'مقرراتي', href: '/lms/my-courses' },
          { label: courseName, href: `/lms/courses/${courseId}` },
          { label: 'الاختبارات' },
        ]}
      />

      {quizzes.length === 0 ? (
        <EmptyState icon={HelpCircle} title="لا توجد اختبارات" description="لم يضف الأستاذ اختبارات بعد" />
      ) : (
        <div className="space-y-3">
          {quizzes.map(quiz => {
            const best       = getBestAttempt(quiz.id);
            const attCount   = getAttemptCount(quiz.id);
            const remaining  = quiz.max_attempts - attCount;
            const isExhausted = remaining <= 0;
            const isAvailable = !quiz.available_from || new Date(quiz.available_from) <= new Date();
            const isPastDue   = quiz.due_date && new Date(quiz.due_date) < new Date();
            const name        = isRTL ? (quiz.title_ar ?? quiz.title) : quiz.title;
            const qCount      = quiz.questions?.length ?? 0;

            return (
              <div key={quiz.id} className={cn(
                'card p-5',
                best?.passed && 'border-green-200',
                isExhausted && 'opacity-70'
              )}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                      best?.passed ? 'bg-green-100' : best ? 'bg-red-100' : 'bg-gray-100'
                    )}>
                      {best?.passed
                        ? <CheckCircle2 className="w-5 h-5 text-green-600" />
                        : best
                        ? <XCircle className="w-5 h-5 text-red-400" />
                        : <HelpCircle className="w-5 h-5 text-gray-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                        <span>{qCount} سؤال</span>
                        <span>{quiz.max_score} نقطة</span>
                        {quiz.time_limit_min && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {quiz.time_limit_min} دقيقة
                          </span>
                        )}
                        <span>المحاولات: {attCount}/{quiz.max_attempts}</span>
                      </div>
                      {quiz.due_date && (
                        <p className={cn('text-xs mt-0.5', isPastDue ? 'text-red-500' : 'text-gray-400')}>
                          {isPastDue ? '⏰ انتهى الموعد: ' : 'الموعد: '}
                          {fDateTime(quiz.due_date, isRTL ? 'ar' : 'en')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Score badge */}
                  {best && (
                    <div className="text-end shrink-0">
                      <span className={cn('text-xl font-black', best.passed ? 'text-green-600' : 'text-red-500')}>
                        {best.percentage?.toFixed(0)}%
                      </span>
                      <p className="text-[10px] text-gray-400">أعلى نتيجة</p>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="mt-4 flex items-center gap-2">
                  {!isAvailable ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Lock className="w-4 h-4" />
                      يفتح في {fDate(quiz.available_from, isRTL ? 'ar' : 'en')}
                    </div>
                  ) : isExhausted ? (
                    <div className="text-sm text-gray-400">استنفدت جميع المحاولات</div>
                  ) : isPastDue ? (
                    <div className="text-sm text-red-400">انتهى الموعد</div>
                  ) : (
                    <Link
                      href={`/lms/courses/${courseId}/quizzes/${quiz.id}`}
                      className={cn('btn flex-1 justify-center', best ? 'btn-secondary' : 'btn-primary')}
                    >
                      {best ? `محاولة جديدة (${remaining} متبقية)` : 'بدء الاختبار'}
                      <ChevronRight className={cn('w-4 h-4', isRTL && 'rotate-180')} />
                    </Link>
                  )}

                  {best && (
                    <Link href={`/lms/courses/${courseId}/grades`} className="btn-ghost text-sm py-2">
                      النتائج
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
