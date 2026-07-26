'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Video, ClipboardList, HelpCircle, PlayCircle, Megaphone, ChevronLeft, GraduationCap, Settings } from 'lucide-react';
import Link from 'next/link';
import { cn, fDateTime } from '@/lib/utils';
import { PageHeader } from '@/components/shared';
import type { UserWithRoles } from '@/types';

type Tab='overview'|'lessons'|'assignments'|'quizzes'|'live'|'announcements';
const TABS=[{k:'overview' as Tab,label:'نظرة عامة',icon:GraduationCap},{k:'lessons' as Tab,label:'الدروس',icon:Video},{k:'assignments' as Tab,label:'الواجبات',icon:ClipboardList},{k:'quizzes' as Tab,label:'الاختبارات',icon:HelpCircle},{k:'live' as Tab,label:'مباشر',icon:PlayCircle},{k:'announcements' as Tab,label:'الإعلانات',icon:Megaphone}];

export function ProfessorCourseClient({ user, section, enrolledCount, lessons, assignments, quizzes, live, announcements }: { user:UserWithRoles;section:any;enrolledCount:number;lessons:any[];assignments:any[];quizzes:any[];live:any[];announcements:any[] }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const [tab,setTab]=useState<Tab>('overview');
  const course=section.course; const semester=section.semester;
  const courseName=isRTL?course?.name_ar:course?.name_en;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="card p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center shrink-0"><Video className="w-6 h-6 text-primary-600"/></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div><p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{course?.code} • الشعبة {section.code}</p><h1 className="text-lg font-bold text-gray-900">{courseName}</h1></div>
            <div className="flex items-center gap-2">
              <Link href={`/professor/section/${section.id}/grades`} className="btn-secondary text-sm py-1.5"><GraduationCap className="w-4 h-4"/>الدرجات</Link>
              <Link href={`/lms/courses/${section.id}`} className="btn-primary text-sm py-1.5"><Video className="w-4 h-4"/>صفحة المقرر</Link>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5"/>{enrolledCount} طالب</span>
            <span>{isRTL?semester?.name_ar:semester?.name_en}</span>
            <span>{section.room??'—'}</span>
            {semester?.is_active&&<span className="badge-green badge text-[10px]">فعال</span>}
          </div>
        </div>
        <Link href="/dashboard/professor" className="btn-ghost p-2 shrink-0"><ChevronLeft className={cn('w-4 h-4',isRTL&&'rotate-180')}/></Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors shrink-0',tab===t.k?'bg-primary-500 text-white':'text-gray-600 hover:bg-gray-100')}>
            <t.icon className="w-3.5 h-3.5"/>{t.label}
            {t.k==='lessons'&&lessons.length>0&&<span className="bg-white/20 text-[10px] px-1.5 rounded-full">{lessons.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {tab==='overview'&&(
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[{label:'الدروس',n:lessons.length,href:`/lms/courses/${section.id}`,icon:Video,c:'text-blue-600'},{label:'الواجبات',n:assignments.length,href:`/lms/courses/${section.id}/assignments`,icon:ClipboardList,c:'text-orange-500'},{label:'الاختبارات',n:quizzes.length,href:`/lms/courses/${section.id}/quizzes`,icon:HelpCircle,c:'text-green-600'},{label:'الجلسات المباشرة',n:live.length,href:`/lms/courses/${section.id}/live`,icon:PlayCircle,c:'text-purple-600'},{label:'الطلاب',n:enrolledCount,href:`/lms/courses/${section.id}/members`,icon:Users,c:'text-primary-600'},{label:'الإعلانات',n:announcements.length,href:`/lms/courses/${section.id}/announcements`,icon:Megaphone,c:'text-amber-500'}].map(item=>(
              <Link key={item.label} href={item.href} className="card-hover p-5 flex flex-col items-center text-center gap-2">
                <item.icon className={cn('w-6 h-6',item.c)}/>
                <p className="text-2xl font-bold text-gray-800">{item.n}</p>
                <p className="text-xs text-gray-400">{item.label}</p>
              </Link>
            ))}
          </div>
        )}
        {tab==='lessons'&&(
          <div className="space-y-2">
            <div className="flex justify-end mb-2"><Link href={`/lms/courses/${section.id}`} className="btn-primary text-sm py-1.5"><Settings className="w-4 h-4"/>إدارة المحتوى</Link></div>
            {lessons.length===0?<div className="card p-10 text-center"><Video className="w-8 h-8 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">لا توجد دروس بعد</p></div>:lessons.map((l:any)=>(
              <div key={l.id} className="card p-4 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center shrink-0">{l.order_index+1}</span>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800">{isRTL?l.title_ar??l.title:l.title}</p><p className="text-xs text-gray-400 capitalize">{l.type} • {Math.floor((l.video_duration_sec??0)/60)} دقيقة</p></div>
                <span className={cn('badge text-[10px]',l.is_published?'badge-green':'badge-yellow')}>{l.is_published?'منشور':'مسودة'}</span>
              </div>
            ))}
          </div>
        )}
        {tab==='assignments'&&(<div className="space-y-2">
          {assignments.length===0?<div className="card p-10 text-center"><ClipboardList className="w-8 h-8 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">لا توجد واجبات</p></div>:assignments.map((a:any)=>(
            <Link key={a.id} href={`/lms/courses/${section.id}/assignments/${a.id}`} className="card p-4 flex items-center gap-3 hover:shadow-elevated transition-shadow">
              <ClipboardList className="w-4 h-4 text-orange-500 shrink-0"/>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800">{isRTL?a.title_ar??a.title:a.title}</p><p className="text-xs text-gray-400">{a.max_score} نقطة{a.due_date?` • الموعد: ${fDateTime(a.due_date,isRTL?'ar':'en')}`:''}</p></div>
              <span className={cn('badge text-[10px]',a.is_published?'badge-green':'badge-yellow')}>{a.is_published?'منشور':'مسودة'}</span>
            </Link>
          ))}
        </div>)}
        {tab==='quizzes'&&(<div className="space-y-2">
          {quizzes.length===0?<div className="card p-10 text-center"><HelpCircle className="w-8 h-8 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">لا توجد اختبارات</p></div>:quizzes.map((q:any)=>(
            <Link key={q.id} href={`/lms/courses/${section.id}/quizzes/${q.id}`} className="card p-4 flex items-center gap-3 hover:shadow-elevated transition-shadow">
              <HelpCircle className="w-4 h-4 text-green-500 shrink-0"/>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800">{isRTL?q.title_ar??q.title:q.title}</p><p className="text-xs text-gray-400">{q.questions?.length??0} سؤال • {q.max_score} نقطة</p></div>
              <span className={cn('badge text-[10px]',q.is_published?'badge-green':'badge-yellow')}>{q.is_published?'منشور':'مسودة'}</span>
            </Link>
          ))}
        </div>)}
        {tab==='live'&&(<div className="space-y-2">
          <div className="flex justify-end mb-2"><Link href={`/lms/courses/${section.id}/live`} className="btn-primary text-sm py-1.5"><Plus className="w-4 h-4"/>جلسة جديدة</Link></div>
          {live.length===0?<div className="card p-10 text-center"><PlayCircle className="w-8 h-8 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">لا توجد جلسات مجدولة</p></div>:live.map((sess:any)=>(
            <div key={sess.id} className="card p-4 flex items-center gap-3">
              <PlayCircle className="w-4 h-4 text-purple-500 shrink-0"/>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-800">{sess.title}</p><p className="text-xs text-gray-400">{fDateTime(sess.scheduled_at,isRTL?'ar':'en')} • {sess.duration_min} دقيقة</p></div>
              <span className={cn('badge text-[10px]',sess.status==='scheduled'?'badge-blue':sess.status==='live'?'badge-green':'badge-gray')}>{sess.status==='scheduled'?'مجدول':sess.status==='live'?'مباشر':'انتهى'}</span>
            </div>
          ))}
        </div>)}
        {tab==='announcements'&&(<div className="space-y-2">
          <div className="flex justify-end mb-2"><Link href={`/lms/courses/${section.id}/announcements`} className="btn-primary text-sm py-1.5"><Megaphone className="w-4 h-4"/>إعلان جديد</Link></div>
          {announcements.length===0?<div className="card p-10 text-center"><Megaphone className="w-8 h-8 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">لا توجد إعلانات</p></div>:announcements.map((ann:any)=>(
            <div key={ann.id} className="card p-4"><p className="text-sm font-bold text-gray-800">{ann.title}</p><p className="text-xs text-gray-500 mt-1 line-clamp-2">{ann.body}</p></div>
          ))}
        </div>)}
      </div>
    </div>
  );
}

function Plus({ className }: { className?: string }) {
  return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>;
}
