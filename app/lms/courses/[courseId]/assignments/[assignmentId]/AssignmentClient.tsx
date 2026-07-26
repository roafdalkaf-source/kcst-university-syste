'use client';
import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Send, CheckCircle2, Clock, AlertCircle, FileText, Link as LinkIcon, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { fDateTime, fCurrency, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const TYPE_AR:Record<string,string>={upload:'رفع ملف',text:'نص',url:'رابط',peer_review:'مراجعة الأقران'};

export function AssignmentClient({ assignment, enrollmentId, mySubmission, allSubmissions, courseId, userId, isStudent }: { assignment:any;enrollmentId:string|null;mySubmission:any;allSubmissions:any[];courseId:string;userId:string;isStudent:boolean }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [text,setText]=useState('');
  const [url,setUrl]=useState('');
  const [file,setFile]=useState<File|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [gradeModal,setGradeModal]=useState<{sub:any;score:string;feedback:string}|null>(null);
  const [grading,setGrading]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const title=isRTL?assignment.title_ar??assignment.title:assignment.title;
  const instructions=isRTL?assignment.instructions_ar??assignment.instructions:assignment.instructions;
  const isDue=assignment.due_date&&new Date(assignment.due_date)<new Date();
  const isLate=isDue&&!assignment.allow_late;

  const submit=async()=>{ if(!enrollmentId){toast.error('غير مسجّل');return;} setSubmitting(true);
    let file_url:string|null=null; let file_name:string|null=null;
    if(file&&assignment.type==='upload'){
      const path=`assignments/${assignment.id}/${userId}/${Date.now()}_${file.name}`;
      const {error}=await sb.storage.from('lms-submissions').upload(path,file);
      if(error){toast.error('فشل رفع الملف');setSubmitting(false);return;}
      const {data:{publicUrl}}=sb.storage.from('lms-submissions').getPublicUrl(path);
      file_url=publicUrl; file_name=file.name;
    }
    const {error}=await sb.from('lms_submissions').upsert({assignment_id:assignment.id,enrollment_id:enrollmentId,text_content:text||null,file_url,file_name,external_url:url||null,submitted_at:new Date().toISOString(),is_late:isDue,status:'submitted',attempt:(mySubmission?.attempt??0)+1},{onConflict:'assignment_id,enrollment_id'});
    setSubmitting(false); if(error){toast.error('فشل التسليم');return;}
    toast.success('تم تسليم الواجب ✅'); router.refresh(); };

  const saveGrade=async()=>{ if(!gradeModal) return; setGrading(true);
    await sb.from('lms_submissions').update({score:parseFloat(gradeModal.score),feedback:gradeModal.feedback||null,status:'graded',graded_by:userId,graded_at:new Date().toISOString()}).eq('id',gradeModal.sub.id);
    setGrading(false); toast.success('تم حفظ التقييم'); setGradeModal(null); router.refresh(); };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-blue badge text-[10px]">{TYPE_AR[assignment.type]}</span>
              <span className="badge-gray badge text-[10px]">{assignment.max_score} نقطة</span>
              {isDue&&<span className="badge-red badge text-[10px]">انتهى الموعد</span>}
            </div>
            <h1 className="text-base font-bold text-gray-900">{title}</h1>
          </div>
          {assignment.due_date&&<div className="text-end shrink-0"><p className="text-[10px] text-gray-400">الموعد النهائي</p><p className={cn('text-xs font-semibold',isDue?'text-red-500':'text-gray-700')}>{fDateTime(assignment.due_date,isRTL?'ar':'en')}</p></div>}
        </div>
        {instructions&&<p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-xl p-4">{instructions}</p>}
      </div>

      {/* STUDENT VIEW */}
      {isStudent&&(
        <>
          {mySubmission&&(
            <div className={cn('card p-5',mySubmission.status==='graded'?'border-green-200 bg-green-50/30':'border-blue-200 bg-blue-50/30')}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><CheckCircle2 className={cn('w-5 h-5',mySubmission.status==='graded'?'text-green-600':'text-blue-500')}/><p className="text-sm font-bold text-gray-800">{mySubmission.status==='graded'?'تم التصحيح':'تم التسليم'}</p></div>
                {mySubmission.score!=null&&<div className="text-end"><p className="text-2xl font-black text-green-600">{mySubmission.score}/{assignment.max_score}</p><p className="text-xs text-gray-400">{Math.round((mySubmission.score/assignment.max_score)*100)}%</p></div>}
              </div>
              {mySubmission.feedback&&<div className="p-3 rounded-xl bg-white border border-green-200"><p className="text-xs text-gray-500 mb-1">تعليق الأستاذ:</p><p className="text-sm text-gray-700">{mySubmission.feedback}</p></div>}
              {mySubmission.text_content&&<p className="text-sm text-gray-600 mt-2"><span className="text-gray-400">إجابتك: </span>{mySubmission.text_content.slice(0,200)}{mySubmission.text_content.length>200?'...':''}</p>}
            </div>
          )}

          {!isLate&&!mySubmission&&(
            <div className="card p-5 space-y-4">
              <h3 className="text-sm font-bold text-gray-800">تسليم الواجب</h3>
              {assignment.type==='text'&&(<div><label className="label">إجابتك *</label><textarea value={text} onChange={e=>setText(e.target.value)} rows={6} placeholder="اكتب إجابتك هنا..." className="input resize-none"/></div>)}
              {assignment.type==='url'&&(<div><label className="label">الرابط *</label><input value={url} onChange={e=>setUrl(e.target.value)} type="url" placeholder="https://..." className="input"/></div>)}
              {assignment.type==='upload'&&(
                <div>
                  <label className="label">الملف *</label>
                  <div onClick={()=>fileRef.current?.click()} className={cn('border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',file?'border-green-400 bg-green-50':'border-gray-200 hover:border-primary-400 hover:bg-primary-50/30')}>
                    {file?(<div className="flex flex-col items-center gap-2"><CheckCircle2 className="w-8 h-8 text-green-500"/><p className="text-sm font-semibold text-green-700">{file.name}</p><p className="text-xs text-gray-400">{(file.size/1024/1024).toFixed(2)} MB</p></div>):(<div className="flex flex-col items-center gap-2"><Upload className="w-8 h-8 text-gray-300"/><p className="text-sm text-gray-500">انقر لاختيار ملف</p><p className="text-xs text-gray-400">الحجم الأقصى: {assignment.max_file_mb} MB</p></div>)}
                  </div>
                  <input ref={fileRef} type="file" className="hidden" onChange={e=>setFile(e.target.files?.[0]??null)}/>
                </div>
              )}
              <button onClick={submit} disabled={submitting||(assignment.type==='text'&&!text.trim())||(assignment.type==='url'&&!url.trim())||(assignment.type==='upload'&&!file)} className="btn-primary w-full py-2.5">
                {submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
                {submitting?'جاري الإرسال...':'تسليم الواجب'}
              </button>
            </div>
          )}
          {isLate&&!mySubmission&&<div className="card p-5 flex items-center gap-3 bg-red-50 border-red-200"><AlertCircle className="w-5 h-5 text-red-500 shrink-0"/><p className="text-sm text-red-700">انتهى الموعد النهائي لهذا الواجب</p></div>}
        </>
      )}

      {/* PROFESSOR VIEW */}
      {!isStudent&&(
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-800">التسليمات ({allSubmissions.length})</h3>
            <p className="text-xs text-gray-400">{allSubmissions.filter(s=>s.status==='graded').length} مصحّح</p>
          </div>
          {allSubmissions.length===0&&<div className="card p-10 text-center"><FileText className="w-8 h-8 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">لا توجد تسليمات بعد</p></div>}
          {allSubmissions.map(sub=>{
            const profile=sub.enrollment?.student?.profile;
            const name=isRTL?profile?.full_name_ar??profile?.full_name:profile?.full_name;
            return (
              <div key={sub.id} className={cn('card p-4',sub.status==='graded'&&'border-green-200')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0"><User className="w-4 h-4"/></div>
                    <div><p className="text-sm font-semibold text-gray-800">{name}</p><p className="text-xs text-gray-400">{fDateTime(sub.submitted_at,isRTL?'ar':'en')}{sub.is_late&&<span className="ms-2 text-red-500">متأخر</span>}</p></div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sub.status==='graded'?(<span className="text-lg font-black text-green-600">{sub.score}/{assignment.max_score}</span>):(<span className="badge-yellow badge text-xs">بانتظار التصحيح</span>)}
                    <button onClick={()=>setGradeModal({sub,score:sub.score?.toString()??'',feedback:sub.feedback??''})} className="btn-secondary text-xs py-1 px-2">{sub.status==='graded'?'تعديل':'تصحيح'}</button>
                  </div>
                </div>
                {sub.text_content&&<p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded-lg line-clamp-2">{sub.text_content}</p>}
                {sub.file_url&&<a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary-500 hover:underline mt-2"><FileText className="w-3.5 h-3.5"/>{sub.file_name??'الملف'}</a>}
                {sub.external_url&&<a href={sub.external_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-primary-500 hover:underline mt-2"><LinkIcon className="w-3.5 h-3.5"/>{sub.external_url}</a>}
                {sub.feedback&&<p className="text-xs text-green-700 bg-green-50 rounded-lg p-2 mt-2">💬 {sub.feedback}</p>}
              </div>
            );
          })}
        </div>
      )}

      {gradeModal&&(
        <div className="modal-backdrop"><div className="modal-box p-6" onClick={e=>e.stopPropagation()}>
          <h2 className="text-base font-bold text-gray-900 mb-4">تصحيح الواجب</h2>
          <div className="space-y-4">
            <div><label className="label">الدرجة (من {assignment.max_score}) *</label><input value={gradeModal.score} onChange={e=>setGradeModal(m=>m?{...m,score:e.target.value}:null)} type="number" min={0} max={assignment.max_score} step={0.5} className="input"/></div>
            <div><label className="label">التعليق</label><textarea value={gradeModal.feedback} onChange={e=>setGradeModal(m=>m?{...m,feedback:e.target.value}:null)} rows={3} className="input resize-none"/></div>
          </div>
          <div className="flex gap-3 mt-5"><button onClick={()=>setGradeModal(null)} className="btn-secondary flex-1">إلغاء</button><button onClick={saveGrade} disabled={grading||!gradeModal.score} className="btn-primary flex-1">{grading&&<Loader2 className="w-4 h-4 animate-spin"/>}حفظ التقييم</button></div>
        </div></div>
      )}
    </div>
  );
}
