'use client';

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, GraduationCap, BookOpen, User, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState } from '@/components/shared';
import { cn, getInitials, fDate } from '@/lib/utils';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { useEffect } from 'react';

type ResultKind = 'student' | 'course' | 'professor';

interface Result {
  id:    string;
  kind:  ResultKind;
  title: string;
  sub:   string;
  href:  string;
  meta?: string;
}

export function SearchClient() {
  const { i18n } = useTranslation();
  const isRTL    = i18n.language === 'ar';
  const sb       = createClient();

  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState<'all' | ResultKind>('all');
  const [debouncedQ]          = useDebounce(query, 350);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);

    const term = `%${q}%`;

    const [
      { data: students },
      { data: courses },
      { data: professors },
    ] = await Promise.all([
      sb.from('students')
        .select('id, student_number, status, profile:profiles(full_name, full_name_ar, email), program:programs(name_ar)')
        .or(`student_number.ilike.${term},profiles.full_name.ilike.${term},profiles.email.ilike.${term}`)
        .limit(8),
      sb.from('courses')
        .select('id, code, name_ar, name_en, department:departments(name_ar)')
        .or(`code.ilike.${term},name_ar.ilike.${term},name_en.ilike.${term}`)
        .eq('is_active', true)
        .limit(6),
      sb.from('profiles')
        .select('id, full_name, full_name_ar, email')
        .or(`full_name.ilike.${term},email.ilike.${term}`)
        .in('id', (await sb.from('user_roles').select('user_id').in('role',['professor','teaching_assistant'])).data?.map(r=>r.user_id) ?? [])
        .limit(5),
    ]);

    const res: Result[] = [
      ...(students ?? []).map((s: any) => ({
        id:    s.id,
        kind:  'student' as ResultKind,
        title: isRTL ? (s.profile?.full_name_ar ?? s.profile?.full_name) : s.profile?.full_name,
        sub:   `${s.student_number} • ${s.profile?.email}`,
        href:  `/academic/students/${s.id}`,
        meta:  isRTL ? s.program?.name_ar : s.program?.name_ar,
      })),
      ...(courses ?? []).map((c: any) => ({
        id:    c.id,
        kind:  'course' as ResultKind,
        title: isRTL ? c.name_ar : c.name_en,
        sub:   `${c.code} • ${c.department?.name_ar}`,
        href:  `/admin/structure`,
        meta:  c.code,
      })),
      ...(professors ?? []).map((p: any) => ({
        id:    p.id,
        kind:  'professor' as ResultKind,
        title: isRTL ? (p.full_name_ar ?? p.full_name) : p.full_name,
        sub:   p.email,
        href:  `/admin/users`,
        meta:  'أستاذ',
      })),
    ];

    setResults(res);
    setLoading(false);
  }, [isRTL]);

  useEffect(() => { doSearch(debouncedQ); }, [debouncedQ, doSearch]);

  const KIND_CONFIG = {
    student:   { icon: GraduationCap, label: 'طالب',   color: 'text-blue-600 bg-blue-50' },
    course:    { icon: BookOpen,      label: 'مقرر',   color: 'text-green-600 bg-green-50' },
    professor: { icon: User,          label: 'أستاذ',  color: 'text-purple-600 bg-purple-50' },
  };

  const shown = filter === 'all' ? results : results.filter(r => r.kind === filter);

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="البحث الشامل"
        description="ابحث في الطلاب، المقررات، الأساتذة"
        breadcrumbs={[{ label: 'الإدارة' }, { label: 'البحث' }]}
      />

      {/* Search input */}
      <div className="relative">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        {loading && (
          <Loader2 className="absolute end-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
        )}
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ابحث بالاسم، رقم الطالب، البريد، كود المقرر..."
          className="input ps-12 pe-10 py-3.5 text-base rounded-2xl shadow-card"
        />
      </div>

      {/* Filter tabs */}
      {results.length > 0 && (
        <div className="flex items-center gap-2">
          {([
            { k: 'all'       as const, l: `الكل (${results.length})` },
            { k: 'student'   as const, l: `طلاب (${results.filter(r=>r.kind==='student').length})` },
            { k: 'course'    as const, l: `مقررات (${results.filter(r=>r.kind==='course').length})` },
            { k: 'professor' as const, l: `أساتذة (${results.filter(r=>r.kind==='professor').length})` },
          ] as const).map(t => (
            <button key={t.k} onClick={() => setFilter(t.k)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                filter === t.k
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {t.l}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {query.length >= 2 && !loading && shown.length === 0 && (
        <EmptyState icon={Search} title="لا توجد نتائج" description={`لم يُعثر على نتائج لـ "${query}"`} />
      )}

      {shown.length > 0 && (
        <div className="space-y-2">
          {shown.map(r => {
            const cfg = KIND_CONFIG[r.kind];
            return (
              <Link key={`${r.kind}-${r.id}`} href={r.href}
                className="card p-4 flex items-center gap-4 hover:shadow-elevated transition-all group">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg font-bold', cfg.color)}>
                  {r.kind === 'student'
                    ? getInitials(r.title)
                    : <cfg.icon className="w-5 h-5" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-primary-600 transition-colors truncate">
                    {r.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{r.sub}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {r.meta && (
                    <span className="text-[10px] text-gray-400 hidden sm:block">{r.meta}</span>
                  )}
                  <span className={cn('badge text-[10px]',
                    r.kind === 'student' ? 'badge-blue' : r.kind === 'course' ? 'badge-green' : 'badge-accent')}>
                    {cfg.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Hints when empty */}
      {!query && (
        <div className="card p-6">
          <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">أمثلة للبحث</p>
          <div className="space-y-2">
            {[
              { q: 'KCST-2025-0001', label: 'رقم الطالب' },
              { q: 'CS301',          label: 'كود المقرر' },
              { q: 'ahmed@',         label: 'البريد الإلكتروني' },
              { q: 'علوم الحاسوب',   label: 'اسم المقرر' },
            ].map(hint => (
              <button key={hint.q} onClick={() => setQuery(hint.q)}
                className="flex items-center gap-3 w-full text-start p-2.5 rounded-lg hover:bg-gray-50 transition-colors group">
                <Search className="w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 transition-colors shrink-0" />
                <span className="text-sm font-mono text-gray-600">{hint.q}</span>
                <span className="text-xs text-gray-400 ms-auto">{hint.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
