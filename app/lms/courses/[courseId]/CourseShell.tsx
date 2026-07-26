'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Video, ClipboardList, HelpCircle, PlayCircle, MessageSquare, Megaphone, BookOpen, Award, Users, ChevronLeft, CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserWithRoles } from '@/types';
import type { LmsLesson, LmsProgress } from '@/types/lms';

const NAV=[{label:'نظرة عامة',href:'',icon:BookOpen},{label:'الدروس',href:'/lessons',icon:Video},{label:'الواجبات',href:'/assignments',icon:ClipboardList},{label:'الاختبارات',href:'/quizzes',icon:HelpCircle},{label:'مباشر',href:'/live',icon:PlayCircle},{label:'نقاشات',href:'/discussions',icon:MessageSquare},{label:'إعلانات',href:'/announcements',icon:Megaphone},{label:'مصادر',href:'/resources',icon:BookOpen},{label:'الدرجات',href:'/grades',icon:Award},{label:'أعضاء',href:'/members',icon:Users}];

export function CourseShell({ user, section, enrollment, outline, progress }: { user:UserWithRoles;section:any;enrollment:any;outline:{lessons:any[];assignments:any[];quizzes:any[];live_sessions:any[];resources:any[];announcements:any[]};progress:any[] }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const [activeNav,setActiveNav]=useState('');
  const courseId=section.id;
  const course=section.course; const professor=section.professor;
  const courseName=isRTL?course?.name_ar:course?.name_en;
  const totalLessons=outline.lessons.length;
  const completedLessons=progress.filter(p=>p.status==='completed').length;
  const completionPct=totalLessons>0?Math.round((completedLessons/totalLessons)*100):0;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden -mx-4 sm:-mx-6 -my-6">
      {/* Left sidebar */}
      <aside className="w-64 shrink-0 bg-white border-e border-gray-100 flex flex-col overflow-y-auto hidden lg:flex">
        <div className="p-4 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{course?.code}</p>
          <h2 className="text-sm font-bold text-gray-900 leading-snug">{courseName}</h2>
          {professor&&<p className="text-xs text-gray-400 mt-1">{isRTL?professor.full_name_ar??professor.full_name:professor.full_name}</p>}
        </div>
        {enrollment&&totalLessons>0&&(
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-1.5"><span className="text-xs text-gray-500">تقدمك</span><span className="text-xs font-bold text-primary-600">{completionPct}%</span></div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{width:`${completionPct}%`}}/></div>
            <p className="text-[10px] text-gray-400 mt-1">{completedLessons} من {totalLessons} درس</p>
          </div>
        )}
        <nav className="flex-1 p-2">
          {NAV.map(n=>(
            <Link key={n.href} href={`/lms/courses/${courseId}${n.href}`}
              className={cn('flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-colors mb-0.5',activeNav===n.href?'bg-primary-500 text-white font-semibold':'text-gray-600 hover:bg-gray-50')}
              onClick={()=>setActiveNav(n.href)}>
              <n.icon className="w-3.5 h-3.5 shrink-0"/>
              <span className="flex-1">{n.label}</span>
              {n.href==='/announcements'&&outline.announcements.length>0&&<span className="text-[10px] font-bold opacity-60">{outline.announcements.length}</span>}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <Link href="/lms/my-courses" className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
            <ChevronLeft className={cn('w-3.5 h-3.5',isRTL&&'rotate-180')}/>العودة لمقرراتي
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">
        {/* Default overview */}
        <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{courseName}</h1>
            <p className="text-sm text-gray-500 mt-1">{isRTL?section.semester?.name_ar:section.semester?.name_en} • {section.enrolled_count} طالب</p>
          </div>
          {course?.description&&<div className="card p-5"><p className="text-sm text-gray-700 leading-relaxed">{course.description}</p></div>}
          {outline.announcements.length>0&&(
            <div className="card p-5">
              <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Megaphone className="w-4 h-4 text-amber-500"/>آخر الإعلانات</h3>
              <div className="space-y-3">
                {outline.announcements.slice(0,2).map((ann:any)=>(
                  <div key={ann.id} className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-sm font-semibold text-gray-800">{ann.title}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{ann.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[{href:'/lessons',label:'الدروس',n:totalLessons,icon:Video,c:'text-blue-600'},{href:'/assignments',label:'الواجبات',n:outline.assignments.length,icon:ClipboardList,c:'text-orange-500'},{href:'/quizzes',label:'الاختبارات',n:outline.quizzes.length,icon:HelpCircle,c:'text-green-600'},{href:'/live',label:'جلسات مباشرة',n:outline.live_sessions.length,icon:PlayCircle,c:'text-purple-600'},{href:'/discussions',label:'النقاشات',n:0,icon:MessageSquare,c:'text-blue-500'},{href:'/resources',label:'المصادر',n:outline.resources.length,icon:BookOpen,c:'text-gray-500'}].map(item=>(
              <Link key={item.href} href={`/lms/courses/${courseId}${item.href}`} className="card-hover p-4 flex flex-col items-center text-center gap-2">
                <item.icon className={cn('w-5 h-5',item.c)}/>
                <p className="text-lg font-bold text-gray-800">{item.n}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </Link>
            ))}
          </div>
          {outline.lessons.length>0&&(
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold text-gray-800">الدروس</h3><Link href={`/lms/courses/${courseId}/lessons`} className="text-xs text-primary-500 hover:underline">الكل</Link></div>
              <div className="space-y-2">
                {outline.lessons.slice(0,5).map((lesson:any,i:number)=>{
                  const prog=progress.find(p=>p.lesson_id===lesson.id);
                  const isDone=prog?.status==='completed';
                  return (
                    <Link key={lesson.id} href={`/lms/courses/${courseId}/lessons/${lesson.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',isDone?'bg-green-100 text-green-600':'bg-gray-100 text-gray-500')}>
                        {isDone?<CheckCircle2 className="w-4 h-4"/>:i+1}
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800 truncate">{isRTL?lesson.title_ar??lesson.title:lesson.title}</p><p className="text-[10px] text-gray-400 capitalize">{lesson.type}{lesson.video_duration_sec?` • ${Math.floor(lesson.video_duration_sec/60)} دقيقة`:''}</p></div>
                      <ChevronLeft className={cn('w-3.5 h-3.5 text-gray-300 group-hover:text-primary-400 transition-colors',isRTL&&'rotate-180')}/>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
