'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, BookOpen, Award } from 'lucide-react';
import { StatCard, PageHeader, GPABadge } from '@/components/shared';
import { gradeColor, cn } from '@/lib/utils';

interface Props {
  enrollments: any[];
  gpa: number;
  totalCredits: number;
}

export function StudentGradesClient({ enrollments, gpa, totalCredits }: Props) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Group by semester
  const bySemester: Record<string, any[]> = {};
  enrollments.forEach(e => {
    const key = e.section?.semester?.name_ar ?? 'غير محدد';
    if (!bySemester[key]) bySemester[key] = [];
    bySemester[key].push(e);
  });

  const publishedGrades = enrollments.filter(e => e.grade?.[0]?.is_published);
  const passedCredits   = publishedGrades
    .filter(e => e.grade?.[0]?.grade_points > 0)
    .reduce((s, e) => s + (e.section?.course?.credits ?? 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="درجاتي" description="سجلك الأكاديمي الكامل" />

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="المعدل التراكمي"    value={gpa.toFixed(2)}    icon={TrendingUp} iconClass={gpa >= 3 ? 'text-green-600' : gpa >= 2 ? 'text-yellow-600' : 'text-red-500'} />
        <StatCard title="الساعات المعتمدة"   value={totalCredits}      icon={BookOpen}   iconClass="text-blue-600" />
        <StatCard title="ساعات ناجح"          value={passedCredits}     icon={Award}      iconClass="text-purple-600" />
      </div>

      {/* By semester */}
      {Object.keys(bySemester).length === 0 ? (
        <div className="card p-10 text-center">
          <BookOpen className="w-8 h-8 text-gray-200 mx-auto mb-2" />
          <p className="text-sm text-gray-400">لا توجد درجات مسجّلة</p>
        </div>
      ) : (
        Object.entries(bySemester).map(([sem, items]) => {
          const semGpa = items.filter(e => e.grade?.[0]?.is_published && e.grade?.[0]?.grade_points != null).length > 0
            ? (items.filter(e => e.grade?.[0]?.is_published)
                .reduce((s,e) => s + (e.grade?.[0]?.grade_points ?? 0) * (e.section?.course?.credits ?? 0), 0) /
              Math.max(1, items.filter(e => e.grade?.[0]?.is_published).reduce((s,e) => s + (e.section?.course?.credits ?? 0), 0))).toFixed(2)
            : null;

          return (
            <div key={sem} className="card overflow-hidden">
              {/* Semester header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-800">{sem}</h3>
                {semGpa && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>معدل الفصل:</span>
                    <GPABadge gpa={parseFloat(semGpa)} />
                  </div>
                )}
              </div>

              {/* Courses table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-50">
                    <th className="px-5 py-2.5 text-start text-xs font-semibold text-gray-400">المقرر</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400">الساعات</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400">مشاركة</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400">واجبات</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400">منتصف</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400">نهائي</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400">المجموع</th>
                    <th className="px-3 py-2.5 text-center text-xs font-semibold text-gray-400">التقدير</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(e => {
                    const course = e.section?.course;
                    const grade  = e.grade?.[0];
                    const name   = isRTL ? course?.name_ar : course?.name_en;

                    return (
                      <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{course?.code}</p>
                        </td>
                        <td className="px-3 py-3 text-center text-xs text-gray-500">{course?.credits}</td>
                        {grade?.is_published ? (
                          <>
                            <td className="px-3 py-3 text-center text-xs">{grade.participation ?? '—'}</td>
                            <td className="px-3 py-3 text-center text-xs">{grade.assignments   ?? '—'}</td>
                            <td className="px-3 py-3 text-center text-xs">{grade.midterm       ?? '—'}</td>
                            <td className="px-3 py-3 text-center text-xs">{grade.final         ?? '—'}</td>
                            <td className="px-3 py-3 text-center">
                              <span className={cn('text-sm font-bold', gradeColor(grade.letter))}>
                                {grade.total?.toFixed(1) ?? '—'}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={cn('text-sm font-bold', gradeColor(grade.letter))}>
                                {grade.letter ?? '—'}
                              </span>
                            </td>
                          </>
                        ) : (
                          <td colSpan={6} className="px-3 py-3 text-center text-xs text-gray-300">
                            لم تُنشر الدرجات بعد
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })
      )}
    </div>
  );
}
