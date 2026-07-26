'use client';

import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Award, HelpCircle, ClipboardList, TrendingUp, ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader, GPABadge, EmptyState } from '@/components/shared';
import { gradeColor, fDateTime, cn } from '@/lib/utils';

interface Props {
  section:           any;
  isStudent:         boolean;
  enrollmentId:      string | null;
  quizAttempts:      any[];
  submissions:       any[];
  gradeEntry:        any;
  allStudentGrades:  any[];
  courseId:          string;
}

export function LmsCourseGradesClient({
  section, isStudent, enrollmentId, quizAttempts, submissions, gradeEntry, allStudentGrades, courseId,
}: Props) {
  const { i18n } = useTranslation();
  const isRTL    = i18n.language === 'ar';

  const courseName = isRTL ? section.course?.name_ar : section.course?.name_en;

  // ── STUDENT VIEW ─────────────────────────
  if (isStudent) {
    const totalQuizScore = quizAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / Math.max(1, quizAttempts.length);
    const gradedSubs     = submissions.filter(s => s.status === 'graded');
    const avgAssignment  = gradedSubs.length > 0
      ? gradedSubs.reduce((s, sub) => s + ((sub.score / sub.assignment?.max_score) * 100), 0) / gradedSubs.length
      : null;

    return (
      <div className="space-y-5 animate-fade-in max-w-2xl">
        <PageHeader
          title="درجاتي في المقرر"
          description={courseName}
          breadcrumbs={[{ label: 'مقرراتي', href: '/lms/my-courses' }, { label: courseName }, { label: 'الدرجات' }]}
        />

        {/* Official grade */}
        {gradeEntry?.is_published ? (
          <div className="card p-5 border-green-200 bg-green-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1">الدرجة الرسمية المنشورة</p>
                <p className="text-3xl font-bold text-gray-900">{gradeEntry.total?.toFixed(1)}/100</p>
              </div>
              <div className="text-end">
                <span className={cn('text-4xl font-black', gradeColor(gradeEntry.letter))}>
                  {gradeEntry.letter}
                </span>
                <p className="text-xs text-gray-500 mt-1">نقاط: {gradeEntry.grade_points?.toFixed(1)}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { l: 'مشاركة', v: gradeEntry.participation, max: 10 },
                { l: 'واجبات', v: gradeEntry.assignments,   max: 10 },
                { l: 'منتصف',  v: gradeEntry.midterm,       max: 30 },
                { l: 'نهائي',  v: gradeEntry.final,         max: 50 },
              ].map(item => (
                <div key={item.l} className="p-2 rounded-lg bg-white border border-green-100">
                  <p className="font-bold text-gray-800">{item.v ?? 0}</p>
                  <p className="text-gray-400">/{item.max}</p>
                  <p className="text-gray-500 mt-0.5">{item.l}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card p-4 flex items-center gap-3 bg-amber-50 border-amber-200">
            <TrendingUp className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700">لم تُنشر الدرجة الرسمية بعد</p>
          </div>
        )}

        {/* Quiz results */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-green-500" />
            نتائج الاختبارات ({quizAttempts.length})
          </h3>
          {quizAttempts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لم تؤدِ أي اختبارات بعد</p>
          ) : (
            <div className="space-y-2">
              {quizAttempts.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {isRTL ? (a.quiz?.title_ar ?? a.quiz?.title) : a.quiz?.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      محاولة {a.attempt_number} • {fDateTime(a.submitted_at, isRTL ? 'ar' : 'en')}
                    </p>
                  </div>
                  <div className="text-end">
                    <span className={cn('text-lg font-bold', a.passed ? 'text-green-600' : 'text-red-500')}>
                      {a.percentage?.toFixed(0)}%
                    </span>
                    <p className="text-xs text-gray-400">{a.score}/{a.max_score}</p>
                    {a.passed
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ms-auto" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400 ms-auto" />
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assignment results */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-orange-500" />
            نتائج الواجبات ({submissions.length})
          </h3>
          {submissions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">لم تسلّم أي واجبات بعد</p>
          ) : (
            <div className="space-y-2">
              {submissions.map(sub => (
                <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {isRTL ? (sub.assignment?.title_ar ?? sub.assignment?.title) : sub.assignment?.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sub.status === 'graded' ? `صُحّح • ${fDateTime(sub.graded_at, isRTL ? 'ar' : 'en')}`
                        : sub.status === 'submitted' ? 'في انتظار التصحيح'
                        : sub.status}
                    </p>
                    {sub.feedback && (
                      <p className="text-xs text-blue-600 mt-1">💬 {sub.feedback}</p>
                    )}
                  </div>
                  <div className="text-end">
                    {sub.score != null ? (
                      <>
                        <span className="text-lg font-bold text-primary-600">
                          {sub.score}/{sub.assignment?.max_score}
                        </span>
                        <p className="text-xs text-gray-400">
                          {Math.round((sub.score / sub.assignment?.max_score) * 100)}%
                        </p>
                      </>
                    ) : (
                      <span className="badge-yellow badge text-xs">
                        {sub.status === 'submitted' ? 'بانتظار التصحيح' : 'مسودة'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── PROFESSOR VIEW ────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="درجات المقرر"
        description={`${courseName} • ${allStudentGrades.length} طالب`}
        breadcrumbs={[{ label: 'مقرراتي', href: '/lms/my-courses' }, { label: courseName }]}
        actions={
          <Link href={`/professor/section/${courseId}/grades`} className="btn-primary text-sm">
            <Award className="w-4 h-4" />
            إدارة جدول الدرجات
          </Link>
        }
      />

      <div className="card overflow-hidden">
        <table className="table-base">
          <thead>
            <tr>
              <th>الطالب</th>
              <th className="text-center">المجموع</th>
              <th className="text-center">التقدير</th>
              <th className="text-center">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {allStudentGrades.length === 0 && (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">لا يوجد طلاب مسجّلون</td></tr>
            )}
            {allStudentGrades.map(enr => {
              const grade   = enr.grade?.[0];
              const student = enr.student;
              return (
                <tr key={enr.id}>
                  <td>
                    <p className="text-sm font-medium text-gray-800">
                      {isRTL ? student?.profile?.full_name_ar ?? student?.profile?.full_name : student?.profile?.full_name}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">{student?.student_number}</p>
                  </td>
                  <td className="text-center">
                    {grade?.is_published
                      ? <span className={cn('font-bold', gradeColor(grade.letter))}>{grade.total?.toFixed(1)}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="text-center">
                    {grade?.is_published
                      ? <span className={cn('font-bold', gradeColor(grade.letter))}>{grade.letter}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="text-center">
                    {grade?.is_published
                      ? <span className="badge-green badge text-xs">منشور</span>
                      : <span className="badge-yellow badge text-xs">غير منشور</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
