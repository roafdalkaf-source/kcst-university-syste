'use client';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { BookOpen, Video, Users, ChevronRight, PlayCircle } from 'lucide-react';
import { cn, fDate } from '@/lib/utils';
import { PageHeader, EmptyState } from '@/components/shared';
import type { UserWithRoles } from '@/types';

const COLORS=['from-blue-600 to-blue-800','from-purple-600 to-purple-800','from-emerald-600 to-emerald-800','from-amber-600 to-amber-800','from-rose-600 to-rose-800','from-cyan-600 to-cyan-800'];

export function MyCoursesClient({ user, enrollments, sections, lessonCounts, upcomingLive, isStudent }: { user:UserWithRoles; enrollments:any[]; sections:any[]; lessonCounts:any[]; upcomingLive:any[]; isStudent:boolean; }) {
  const { i18n } = useTranslation(); const isRTL=i18n.language==='ar';
  const getLessonCount=(sid:string)=>lessonCounts.filter((l:any)=>l.section_id===sid).length;
  const getNextLive=(sid:string)=>upcomingLive.find((l:any)=>l.section_id===sid);
  const items=isStudent?enrollments.map((e:any)=>({...e.section,enrollmentId:e.id})):sections;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title={isStudent?'مقرراتي':'مقرراتي التي أدرّسها'} description={`${items.length} مقرر ${isStudent?'مسجّل':'نشط'} هذا الفصل`}/>
      {upcomingLive.length>0 && (
        <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0"><PlayCircle className="w-5 h-5 text-amber-300"/></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/70 font-medium">جلسة مباشرة قادمة</p>
            <p className="text-sm font-bold truncate">{upcomingLive[0].title}</p>
          </div>
          <Link href={`/lms/live/${upcomingLive[0].id}`} className="text-xs text-amber-300 font-medium hover:underline shrink-0">انضم الآن →</Link>
        </div>
      )}
      {items.length===0
        ?<EmptyState icon={BookOpen} title="لا توجد مقررات" description="لم يتم تسجيلك في أي مقرر حتى الآن"/>
        :(
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((section:any,i:number)=>{
              const course=section.course; const semester=section.semester; const professor=section.professor;
              const lessonCnt=getLessonCount(section.id); const nextLive=getNextLive(section.id);
              const color=COLORS[i%COLORS.length]; const name=isRTL?course?.name_ar:course?.name_en;
              return (
                <Link key={section.id} href={`/lms/courses/${section.id}`} className="card-hover group flex flex-col overflow-hidden">
                  <div className={cn('bg-gradient-to-br p-5 relative overflow-hidden',color)}>
                    <div className="absolute top-0 end-0 w-24 h-24 rounded-full bg-white/5 translate-x-8 -translate-y-8"/>
                    <div className="relative z-10">
                      <span className="inline-block bg-white/20 text-white text-xs font-mono px-2 py-0.5 rounded mb-2">{course?.code} • {isRTL?semester?.name_ar:semester?.name_en}</span>
                      <h3 className="text-white font-bold text-base leading-snug line-clamp-2">{name}</h3>
                    </div>
                  </div>
                  <div className="p-4 flex flex-col gap-3 flex-1">
                    {isStudent&&professor&&(
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">{(professor.full_name||'P')[0]}</div>
                        {isRTL?(professor.full_name_ar??professor.full_name):professor.full_name}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5"/>{lessonCnt} درس</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/>{section.enrolled_count}/{section.capacity}</span>
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/>{course?.credits} ساعة</span>
                    </div>
                    {nextLive&&(
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100 text-xs">
                        <PlayCircle className="w-4 h-4 text-amber-500 shrink-0"/>
                        <span className="text-amber-700 font-medium truncate">{nextLive.title}</span>
                        <span className="text-amber-500 ms-auto shrink-0">{fDate(nextLive.scheduled_at,isRTL?'ar':'en')}</span>
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs text-gray-400">{isStudent?'الدخول للمقرر':'إدارة المقرر'}</span>
                      <ChevronRight className={cn('w-4 h-4 text-gray-300 group-hover:text-primary-500 transition-colors',isRTL&&'rotate-180')}/>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
