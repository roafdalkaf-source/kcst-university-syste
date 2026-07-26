'use client';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, CheckCircle2, FileText, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { LmsLesson } from '@/types/lms';

export function LessonViewerClient({ lesson, enrollmentId, progress, prevLesson, nextLesson, courseId, userId }: { lesson:any;enrollmentId:string|null;progress:any;prevLesson:any;nextLesson:any;courseId:string;userId:string }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const sb=createClient();
  const [done,setDone]=useState(progress?.status==='completed');
  const [marking,setMarking]=useState(false);
  const videoRef=useRef<HTMLVideoElement>(null);
  const title=isRTL?lesson.title_ar??lesson.title:lesson.title;

  const markComplete=async()=>{ if(!enrollmentId||done) return; setMarking(true);
    if(progress){await sb.from('lms_progress').update({status:'completed',completed_at:new Date().toISOString()}).eq('id',progress.id);}
    else{await sb.from('lms_progress').insert({enrollment_id:enrollmentId,lesson_id:lesson.id,status:'completed',watched_seconds:lesson.video_duration_sec??0,completed_at:new Date().toISOString(),last_position:0});}
    setDone(true); setMarking(false); toast.success('تم تحديد الدرس كمكتمل ✅'); };

  // Auto-mark complete for text/document lessons after 3 seconds
  useEffect(()=>{ if(!enrollmentId||done) return;
    if(['text','document'].includes(lesson.type)){const t=setTimeout(()=>markComplete(),3000);return()=>clearTimeout(t);}
  },[]);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Navigation breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href={`/lms/courses/${courseId}`} className="btn-ghost p-1.5"><ChevronLeft className={cn('w-4 h-4',isRTL&&'rotate-180')}/></Link>
        <div className="flex-1 min-w-0"><p className="text-xs text-gray-400">المقرر</p><p className="text-sm font-semibold text-gray-800 truncate">الدرس</p></div>
        {done&&<div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold"><CheckCircle2 className="w-4 h-4"/>مكتمل</div>}
      </div>

      {/* Video player */}
      {lesson.type==='video'&&lesson.video_url&&(
        <div className="card overflow-hidden bg-black aspect-video">
          <video ref={videoRef} src={lesson.video_url} controls className="w-full h-full"
            onEnded={()=>{if(!done)markComplete();}}
            onTimeUpdate={()=>{ const v=videoRef.current; if(v&&!done&&v.currentTime/v.duration>0.9)markComplete(); }}/>
        </div>
      )}

      {/* YouTube embed */}
      {lesson.type==='youtube'&&lesson.youtube_id&&(
        <div className="card overflow-hidden aspect-video">
          <iframe src={`https://www.youtube.com/embed/${lesson.youtube_id}`} title={title} allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen className="w-full h-full border-0"/>
        </div>
      )}

      {/* PDF/File viewer */}
      {lesson.type==='document'&&lesson.file_url&&(
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><FileText className="w-6 h-6 text-blue-600"/></div>
          <div className="flex-1"><p className="text-sm font-semibold text-gray-800">{lesson.file_name??'ملف الدرس'}</p><p className="text-xs text-gray-400">انقر للفتح أو التحميل</p></div>
          <a href={lesson.file_url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm"><ExternalLink className="w-4 h-4"/>فتح</a>
        </div>
      )}

      {/* Text content */}
      {lesson.content&&(
        <div className="card p-6 prose prose-sm max-w-none text-gray-700 leading-relaxed">
          <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
          <div dangerouslySetInnerHTML={{__html:lesson.content.replace(/\n/g,'<br/>')}}/>
        </div>
      )}

      {!lesson.content&&(lesson.type==='text')&&(
        <div className="card p-6"><h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2><p className="text-sm text-gray-400">لا يوجد محتوى نصي لهذا الدرس.</p></div>
      )}

      {/* Mark complete button */}
      {enrollmentId&&!done&&lesson.type!=='text'&&lesson.type!=='document'&&(
        <button onClick={markComplete} disabled={marking} className="btn-success w-full py-3">
          {marking?<span className="flex items-center gap-2 justify-center"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>جاري...</span>:<span className="flex items-center gap-2 justify-center"><CheckCircle2 className="w-5 h-5"/>تحديد كمكتمل</span>}
        </button>
      )}
      {done&&<div className="flex items-center justify-center gap-2 py-3 text-green-600 font-semibold"><CheckCircle2 className="w-5 h-5"/>تم إتمام هذا الدرس</div>}

      {/* Prev / Next navigation */}
      <div className="flex items-center justify-between">
        {prevLesson?<Link href={`/lms/courses/${courseId}/lessons/${prevLesson.id}`} className="btn-secondary flex-1 me-2 py-2.5 text-sm">{isRTL?<ChevronRight className="w-4 h-4"/>:<ChevronLeft className="w-4 h-4"/>}الدرس السابق</Link>:<div className="flex-1"/>}
        {nextLesson?<Link href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`} className="btn-primary flex-1 ms-2 py-2.5 text-sm justify-center">الدرس التالي{isRTL?<ChevronLeft className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}</Link>:<div className="flex-1"/>}
      </div>
    </div>
  );
}
