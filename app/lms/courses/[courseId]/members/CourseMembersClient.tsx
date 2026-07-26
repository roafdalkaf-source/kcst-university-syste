'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, GraduationCap, ChevronLeft, Search } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { getInitials, fDate, cn } from '@/lib/utils';
import Link from 'next/link';

interface Props {
  section:       any;
  enrollments:   any[];
  currentUserId: string;
}

export function CourseMembersClient({ section, enrollments, currentUserId }: Props) {
  const { i18n } = useTranslation();
  const isRTL    = i18n.language === 'ar';
  const [search, setSearch] = useState('');

  const professor   = section.professor;
  const courseName  = isRTL ? section.course?.name_ar : section.course?.name_en;

  const filtered = enrollments.filter(enr => {
    if (!search) return true;
    const name = enr.student?.profile?.full_name?.toLowerCase() ?? '';
    const num  = enr.student?.student_number?.toLowerCase() ?? '';
    const q    = search.toLowerCase();
    return name.includes(q) || num.includes(q);
  });

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="أعضاء المقرر"
        description={`${courseName} • ${enrollments.length} طالب مسجّل`}
        breadcrumbs={[
          { label: 'مقرراتي', href: '/lms/my-courses' },
          { label: courseName, href: `/lms/courses/${section.id}` },
          { label: 'الأعضاء' },
        ]}
      />

      {/* Instructor card */}
      {professor && (
        <div className="card p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">المدرّس</p>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center text-lg font-bold shrink-0">
              {getInitials(professor.full_name ?? 'P')}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">
                {isRTL ? (professor.full_name_ar ?? professor.full_name) : professor.full_name}
              </p>
              <p className="text-xs text-gray-400">{professor.email}</p>
            </div>
            <span className="badge-accent badge ms-auto text-xs">أستاذ المقرر</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الرقم..."
          className="input ps-9 text-sm"
        />
      </div>

      {/* Students */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <p className="text-sm font-semibold text-gray-700">
            الطلاب ({filtered.length}{filtered.length !== enrollments.length ? ` من ${enrollments.length}` : ''})
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">لا توجد نتائج</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((enr, i) => {
              const student  = enr.student;
              const profile  = student?.profile;
              const name     = isRTL ? (profile?.full_name_ar ?? profile?.full_name) : profile?.full_name;
              const isMe     = profile?.id === currentUserId;

              return (
                <div key={enr.id} className={cn('flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors', isMe && 'bg-primary-50/40')}>
                  <span className="text-xs text-gray-300 w-6 shrink-0 text-center">{i + 1}</span>
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm font-bold shrink-0">
                    {getInitials(profile?.full_name ?? 'S')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                      {isMe && <span className="badge-blue badge text-[10px]">أنت</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">
                      {student?.student_number} • المستوى {student?.current_level}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 shrink-0 hidden sm:block">
                    {fDate(enr.enrolled_at, isRTL ? 'ar' : 'en')}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
