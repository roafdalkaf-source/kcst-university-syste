'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlayCircle, Plus, ExternalLink, Clock, Video, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState } from '@/components/shared';
import { fDateTime, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const schema=z.object({title:z.string().min(2,'مطلوب'),description:z.string().optional(),scheduled_at:z.string().min(1,'مطلوب'),duration_min:z.number().int().min(15).max(480),platform:z.enum(['zoom','meet','teams','jitsi','bigbluebutton']),meeting_url:z.string().url('رابط غير صالح').optional().or(z.literal('')),meeting_id:z.string().optional(),meeting_pass:z.string().optional()});
type F=z.infer<typeof schema>;
const PLATFORM_AR:Record<string,string>={zoom:'Zoom',meet:'Google Meet',teams:'MS Teams',jitsi:'Jitsi',bigbluebutton:'BigBlueButton'};
const STATUS_CFG:Record<string,{label:string;badge:string}>={scheduled:{label:'مجدول',badge:'badge-blue'},live:{label:'مباشر الآن',badge:'badge-green'},ended:{label:'انتهى',badge:'badge-gray'},cancelled:{label:'ملغي',badge:'badge-red'}};

export function LiveSessionsClient({ sessions, courseId, userId, isProfessor, section }: { sessions:any[];courseId:string;userId:string;isProfessor:boolean;section:any }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [modal,setModal]=useState(false);
  const [saving,setSaving]=useState(false);
  const { register,handleSubmit,reset,formState:{errors} }=useForm<F>({resolver:zodResolver(schema),defaultValues:{duration_min:60,platform:'zoom'}});
  const courseName=isRTL?section.course?.name_ar:section.course?.name_en;

  const onSubmit=async(data:F)=>{ setSaving(true);
    const {error}=await sb.from('lms_live_sessions').insert({section_id:courseId,title:data.title,description:data.description||null,scheduled_at:data.scheduled_at,duration_min:data.duration_min,platform:data.platform,meeting_url:data.meeting_url||null,meeting_id:data.meeting_id||null,meeting_pass:data.meeting_pass||null,status:'scheduled',created_by:userId});
    setSaving(false); if(error){toast.error('فشل إنشاء الجلسة');return;}
    // Notify enrolled students
    const {data:enrs}=await sb.from('enrollments').select('student:students(profile_id)').eq('section_id',courseId).eq('status','enrolled');
    if(enrs?.length){const notifs=(enrs as any[]).map(e=>({user_id:e.student?.profile_id,type:'announcement',title_ar:`جلسة مباشرة: ${data.title}`,title_en:`Live Session: ${data.title}`,body_ar:`${fDateTime(data.scheduled_at,'ar')} • ${PLATFORM_AR[data.platform]}`,link:`/lms/courses/${courseId}/live`})).filter(n=>n.user_id);if(notifs.length)await sb.from('notifications').insert(notifs);}
    toast.success('تم إنشاء الجلسة وإشعار الطلاب'); setModal(false); reset(); router.refresh(); };

  const upcoming=sessions.filter(s=>s.status==='scheduled');
  const past=sessions.filter(s=>['ended','cancelled'].includes(s.status));

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <PageHeader title="الجلسات المباشرة" description={courseName}
        breadcrumbs={[{label:'مقرراتي',href:'/lms/my-courses'},{label:courseName,href:`/lms/courses/${courseId}`},{label:'مباشر'}]}
        actions={isProfessor?(<button onClick={()=>setModal(true)} className="btn-primary text-sm"><Plus className="w-4 h-4"/>جلسة جديدة</button>):undefined}/>

      {sessions.length===0?<EmptyState icon={Video} title="لا توجد جلسات" description={isProfessor?'جدول أول جلسة مباشرة':'لم يجدول الأستاذ جلسات بعد'} action={isProfessor?{label:'جلسة جديدة',onClick:()=>setModal(true)}:undefined}/>:(
        <div className="space-y-6">
          {upcoming.length>0&&(<div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">قادمة ({upcoming.length})</p>
            <div className="space-y-3">{upcoming.map(sess=>(
              <div key={sess.id} className="card p-5 border-blue-200 bg-blue-50/30">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center shrink-0"><PlayCircle className="w-6 h-6 text-blue-600"/></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div><p className="text-sm font-bold text-gray-800">{sess.title}</p><p className="text-xs text-gray-500 mt-0.5">{PLATFORM_AR[sess.platform]} • {sess.duration_min} دقيقة</p></div>
                      <span className={cn('badge text-xs',STATUS_CFG[sess.status]?.badge)}>{STATUS_CFG[sess.status]?.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-600"><Clock className="w-3.5 h-3.5 text-blue-500"/>{fDateTime(sess.scheduled_at,isRTL?'ar':'en')}</div>
                    {sess.description&&<p className="text-xs text-gray-500 mt-2">{sess.description}</p>}
                    {sess.meeting_pass&&<p className="text-xs text-gray-400 mt-1">كلمة المرور: <span className="font-mono font-medium text-gray-600">{sess.meeting_pass}</span></p>}
                  </div>
                </div>
                {sess.meeting_url&&<a href={sess.meeting_url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 w-full text-sm py-2.5"><ExternalLink className="w-4 h-4"/>الانضمام للجلسة</a>}
              </div>
            ))}</div>
          </div>)}
          {past.length>0&&(<div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">منتهية ({past.length})</p>
            <div className="space-y-2">{past.map(sess=>(
              <div key={sess.id} className="card p-4 flex items-center gap-3 opacity-60">
                <Video className="w-4 h-4 text-gray-400 shrink-0"/>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-600 truncate">{sess.title}</p><p className="text-xs text-gray-400">{fDateTime(sess.scheduled_at,isRTL?'ar':'en')}</p></div>
                <span className={cn('badge text-[10px]',STATUS_CFG[sess.status]?.badge)}>{STATUS_CFG[sess.status]?.label}</span>
                {sess.recording_url&&<a href={sess.recording_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline shrink-0">التسجيل</a>}
              </div>
            ))}</div>
          </div>)}
        </div>
      )}

      {modal&&isProfessor&&(
        <div className="modal-backdrop"><div className="modal-box p-6 max-w-lg" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5"><h2 className="text-base font-bold text-gray-900">جلسة مباشرة جديدة</h2><button onClick={()=>setModal(false)} className="btn-ghost p-1.5"><X className="w-4 h-4"/></button></div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><label className="label">عنوان الجلسة *</label><input {...register('title')} className={cn('input',errors.title&&'input-error')} placeholder="محاضرة الوحدة الأولى..."/>{errors.title&&<p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">التاريخ والوقت *</label><input {...register('scheduled_at')} type="datetime-local" className="input"/></div>
              <div><label className="label">المدة (دقيقة) *</label><input {...register('duration_min',{valueAsNumber:true})} type="number" min={15} max={480} className="input"/></div>
            </div>
            <div><label className="label">المنصة *</label><select {...register('platform')} className="input">{Object.entries(PLATFORM_AR).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
            <div><label className="label">رابط الاجتماع</label><input {...register('meeting_url')} type="url" placeholder="https://zoom.us/j/..." className={cn('input',errors.meeting_url&&'input-error')}/>{errors.meeting_url&&<p className="text-xs text-red-500 mt-1">{errors.meeting_url.message}</p>}</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">معرّف الاجتماع</label><input {...register('meeting_id')} className="input font-mono text-sm"/></div>
              <div><label className="label">كلمة المرور</label><input {...register('meeting_pass')} className="input"/></div>
            </div>
            <div><label className="label">وصف (اختياري)</label><textarea {...register('description')} rows={2} className="input resize-none"/></div>
            <div className="flex gap-3 pt-1"><button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">إلغاء</button><button type="submit" disabled={saving} className="btn-primary flex-1">{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}إنشاء وإشعار الطلاب</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}
