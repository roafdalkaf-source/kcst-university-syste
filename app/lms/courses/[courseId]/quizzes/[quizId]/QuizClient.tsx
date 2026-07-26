'use client';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Timer, CheckCircle2, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type Phase='intro'|'taking'|'review';

export function QuizClient({ quiz, enrollmentId, existingAttempts, courseId, userId, isProfessor }: { quiz:any;enrollmentId:string|null;existingAttempts:any[];courseId:string;userId:string;isProfessor:boolean }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [phase,setPhase]=useState<Phase>('intro');
  const [answers,setAnswers]=useState<Record<string,string>>({});
  const [attemptId,setAttemptId]=useState<string|null>(null);
  const [timeLeft,setTimeLeft]=useState<number|null>(null);
  const [submitting,setSubmitting]=useState(false);
  const [result,setResult]=useState<any>(null);
  const timerRef=useRef<NodeJS.Timeout|null>(null);
  const startedAt=useRef<Date>(new Date());

  const bestAttempt=existingAttempts.filter(a=>a.status==='graded').sort((a,b)=>(b.percentage??0)-(a.percentage??0))[0];
  const attCount=existingAttempts.filter(a=>a.status!=='in_progress').length;
  const remaining=quiz.max_attempts-attCount;
  const title=isRTL?quiz.title_ar??quiz.title:quiz.title;

  const startQuiz=async()=>{
    if(!enrollmentId){toast.error('غير مسجّل');return;}
    const {data,error}=await sb.from('lms_quiz_attempts').insert({quiz_id:quiz.id,enrollment_id:enrollmentId,attempt_number:attCount+1,started_at:new Date().toISOString(),status:'in_progress',answers:[],max_score:quiz.max_score}).select('id').single();
    if(error||!data){toast.error('فشل بدء الاختبار');return;}
    setAttemptId(data.id); startedAt.current=new Date();
    if(quiz.time_limit_min){setTimeLeft(quiz.time_limit_min*60);}
    setPhase('taking');
  };

  // Countdown timer
  useEffect(()=>{
    if(phase!=='taking'||timeLeft===null) return;
    if(timeLeft<=0){submitQuiz();return;}
    timerRef.current=setTimeout(()=>setTimeLeft(t=>t!==null?t-1:null),1000);
    return()=>{if(timerRef.current)clearTimeout(timerRef.current);};
  },[phase,timeLeft]);

  const submitQuiz=async()=>{
    if(!attemptId){return;} setSubmitting(true);
    if(timerRef.current)clearTimeout(timerRef.current);
    const timeTaken=Math.floor((new Date().getTime()-startedAt.current.getTime())/1000);
    const questions=quiz.questions??[];
    let score=0;
    const answerEntries=questions.map((q:any)=>{
      const given=answers[q.id]??'';
      let correct=false;
      if(q.type==='mcq'||q.type==='true_false'){
        const correctAns=q.answers?.find((a:any)=>a.is_correct);
        correct=correctAns?.id===given;
        if(correct)score+=q.points;
      }
      return {question_id:q.id,answer_id:q.type!=='short_answer'&&q.type!=='essay'?given:undefined,text_answer:q.type==='short_answer'||q.type==='essay'?given:undefined};
    });
    const pct=quiz.max_score>0?Math.round((score/quiz.max_score)*100):0;
    const passed=quiz.passing_score?score>=quiz.passing_score:pct>=60;
    await sb.from('lms_quiz_attempts').update({status:'graded',submitted_at:new Date().toISOString(),time_taken_sec:timeTaken,score,percentage:pct,passed,answers:answerEntries}).eq('id',attemptId);
    setResult({score,pct,passed,total:quiz.max_score}); setSubmitting(false); setPhase('review');
  };

  const formatTime=(s:number)=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const questions=quiz.questions??[];
  const answered=Object.keys(answers).length;

  if(phase==='intro') return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <div className="card p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4"><span className="text-3xl">📝</span></div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>
        {quiz.instructions&&<p className="text-sm text-gray-500 mb-4">{isRTL?quiz.instructions:quiz.instructions}</p>}
        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          {[{label:'الأسئلة',v:questions.length},{label:'الدرجة',v:quiz.max_score},{label:'المحاولات',v:`${attCount}/${quiz.max_attempts}`}].map(item=>(
            <div key={item.label} className="p-3 rounded-xl bg-gray-50"><p className="text-xl font-bold text-gray-800">{item.v}</p><p className="text-xs text-gray-400">{item.label}</p></div>
          ))}
        </div>
        {quiz.time_limit_min&&<p className="text-sm text-amber-600 bg-amber-50 rounded-xl p-3 mb-4 flex items-center justify-center gap-2"><Timer className="w-4 h-4"/>الوقت المحدد: {quiz.time_limit_min} دقيقة</p>}
        {bestAttempt&&<div className="p-3 rounded-xl bg-green-50 border border-green-200 mb-4 text-sm text-green-700">أعلى نتيجة سابقة: <strong>{bestAttempt.percentage?.toFixed(0)}%</strong></div>}
        {!isProfessor&&remaining>0?<button onClick={startQuiz} className="btn-primary w-full py-3">بدء الاختبار ({remaining} محاولة متبقية)</button>:<p className="text-sm text-gray-400">لا توجد محاولات متبقية</p>}
      </div>
    </div>
  );

  if(phase==='review') return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
      <div className={cn('card p-6 text-center',result?.passed?'border-green-200 bg-green-50':'border-red-200 bg-red-50')}>
        <div className="text-5xl mb-3">{result?.passed?'🎉':'😔'}</div>
        <h2 className="text-xl font-bold mb-1">{result?.passed?'أحسنت!':'حاول مجدداً'}</h2>
        <p className="text-5xl font-black my-4" style={{color:result?.passed?'#16A34A':'#DC2626'}}>{result?.pct}%</p>
        <p className="text-sm text-gray-600">{result?.score}/{result?.total} نقطة</p>
        {result?.passed?<p className="text-sm text-green-600 mt-2 font-medium">✅ اجتزت هذا الاختبار</p>:<p className="text-sm text-red-500 mt-2">لم تبلغ درجة النجاح{quiz.passing_score?` (${quiz.passing_score}/${quiz.max_score})`:' (60%)'}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={()=>{setPhase('intro');setAnswers({});setAttemptId(null);setResult(null);}} className="btn-secondary flex-1">العودة</button>
          {remaining>1&&<button onClick={()=>{setPhase('intro');setAnswers({});setAttemptId(null);setResult(null);}} className="btn-primary flex-1">محاولة أخرى</button>}
        </div>
      </div>
    </div>
  );

  // Taking phase
  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-center justify-between sticky top-14 bg-surface-raised py-2 z-10">
        <h2 className="text-sm font-bold text-gray-800">{title}</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{answered}/{questions.length} أجبت</span>
          {timeLeft!==null&&<div className={cn('flex items-center gap-1 font-mono font-bold text-sm px-3 py-1.5 rounded-lg',timeLeft<60?'bg-red-50 text-red-600':'bg-amber-50 text-amber-600')}><Timer className="w-3.5 h-3.5"/>{formatTime(timeLeft)}</div>}
          <button onClick={submitQuiz} disabled={submitting} className="btn-primary text-sm py-1.5 px-3">{submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}تسليم</button>
        </div>
      </div>
      <div className="space-y-5">
        {questions.map((q:any,qi:number)=>{
          const given=answers[q.id];
          const qTitle=isRTL?q.body_ar??q.body:q.body;
          return (
            <div key={q.id} className="card p-5">
              <div className="flex gap-3 mb-4">
                <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center shrink-0">{qi+1}</span>
                <div className="flex-1"><p className="text-sm font-semibold text-gray-800 leading-relaxed">{qTitle}</p><p className="text-[10px] text-gray-400 mt-1">{q.points} نقطة</p></div>
              </div>
              {(q.type==='mcq'||q.type==='true_false')&&(
                <div className="space-y-2 ms-10">
                  {(q.answers??[]).map((ans:any)=>{
                    const aTitle=isRTL?ans.body_ar??ans.body:ans.body;
                    return (
                      <label key={ans.id} className={cn('flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all',given===ans.id?'border-primary-500 bg-primary-50':'border-gray-100 hover:border-gray-200')}>
                        <input type="radio" name={q.id} value={ans.id} checked={given===ans.id} onChange={()=>setAnswers(p=>({...p,[q.id]:ans.id}))} className="accent-primary-500 w-4 h-4 shrink-0"/>
                        <span className="text-sm text-gray-700">{aTitle}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {(q.type==='short_answer'||q.type==='essay')&&(
                <div className="ms-10">
                  {q.type==='short_answer'?<input value={given??''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} placeholder="أجابتك..." className="input"/>:<textarea value={given??''} onChange={e=>setAnswers(p=>({...p,[q.id]:e.target.value}))} rows={4} placeholder="أجابتك..." className="input resize-none"/>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button onClick={submitQuiz} disabled={submitting} className="btn-primary w-full py-3">
        {submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
        تسليم الاختبار النهائي
      </button>
    </div>
  );
}
