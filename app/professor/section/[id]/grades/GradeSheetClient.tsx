'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Send, Loader2, ChevronLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, ConfirmModal } from '@/components/shared';
import { calcGradeTotal, getLetterGrade, gradeColor, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type GradeRow = { enrollment_id:string; participation:number; assignments:number; midterm:number; final:number; };

export function GradeSheetClient({ section, enrollments, userId }: { section:any; enrollments:any[]; userId:string }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [grades,setGrades]=useState<Record<string,GradeRow>>(()=>{
    const init:Record<string,GradeRow>={};
    enrollments.forEach(enr=>{ const g=enr.grade?.[0];
      init[enr.id]={enrollment_id:enr.id,participation:g?.participation??0,assignments:g?.assignments??0,midterm:g?.midterm??0,final:g?.final??0};
    }); return init;
  });
  const [saving,setSaving]=useState(false);
  const [publishing,setPublishing]=useState(false);
  const [publishModal,setPublishModal]=useState(false);

  const update=(enrollId:string,field:keyof Omit<GradeRow,'enrollment_id'>,val:number)=>{
    setGrades(prev=>({...prev,[enrollId]:{...prev[enrollId],[field]:val}}));
  };

  const saveAll=async()=>{ setSaving(true);
    for(const enrId of Object.keys(grades)){
      const g=grades[enrId]; const total=calcGradeTotal({participation:g.participation,assignments:g.assignments,midterm:g.midterm,final:g.final});
      const letterInfo=getLetterGrade(total);
      const existing=enrollments.find(e=>e.id===enrId)?.grade?.[0];
      if(existing){
        await sb.from('grade_entries').update({participation:g.participation,assignments:g.assignments,midterm:g.midterm,final:g.final,total,letter:letterInfo.letter,grade_points:letterInfo.points}).eq('id',existing.id);
      } else {
        await sb.from('grade_entries').insert({enrollment_id:enrId,participation:g.participation,assignments:g.assignments,midterm:g.midterm,final:g.final,total,letter:letterInfo.letter,grade_points:letterInfo.points,graded_by:userId});
      }
    }
    setSaving(false); toast.success('تم حفظ الدرجات'); router.refresh(); };

  const publishAll=async()=>{ setPublishing(true);
    const gradeIds=enrollments.map(e=>e.grade?.[0]?.id).filter(Boolean);
    if(gradeIds.length>0) await sb.from('grade_entries').update({is_published:true,published_at:new Date().toISOString()}).in('id',gradeIds);
    setPublishing(false); setPublishModal(false); toast.success('تم نشر الدرجات وإشعار الطلاب'); router.refresh(); };

  const courseName=isRTL?section.course?.name_ar:section.course?.name_en;
  const allPublished=enrollments.every(e=>e.grade?.[0]?.is_published);
  const hasGrades=enrollments.some(e=>e.grade?.[0]);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="جدول الدرجات" description={`${courseName} • ${enrollments.length} طالب`}
        breadcrumbs={[{label:'شعبي'},{label:courseName,href:`/professor/section/${section.id}`},{label:'الدرجات'}]}
        actions={
          <div className="flex gap-2">
            <Link href={`/professor/section/${section.id}`} className="btn-secondary text-sm py-1.5"><ChevronLeft className={cn('w-4 h-4',isRTL&&'rotate-180')}/>رجوع</Link>
            <button onClick={saveAll} disabled={saving} className="btn-secondary text-sm py-1.5">{saving?<Loader2 className="w-4 h-4 animate-spin"/>:<Save className="w-4 h-4"/>}حفظ</button>
            {!allPublished&&hasGrades&&<button onClick={()=>setPublishModal(true)} className="btn-primary text-sm py-1.5"><Send className="w-4 h-4"/>نشر الدرجات</button>}
          </div>
        }/>

      {allPublished&&<div className="flex items-center gap-3 p-3 rounded-xl bg-green-50 border border-green-200"><AlertCircle className="w-4 h-4 text-green-600 shrink-0"/><p className="text-sm text-green-700">تم نشر جميع الدرجات</p></div>}

      <div className="table-wrapper overflow-x-auto">
        <table className="table-base min-w-[700px]">
          <thead>
            <tr>
              <th className="w-48">الطالب</th>
              <th className="text-center w-24">مشاركة<br/><span className="text-[10px] font-normal text-gray-400">من 10</span></th>
              <th className="text-center w-24">واجبات<br/><span className="text-[10px] font-normal text-gray-400">من 10</span></th>
              <th className="text-center w-24">منتصف<br/><span className="text-[10px] font-normal text-gray-400">من 30</span></th>
              <th className="text-center w-24">نهائي<br/><span className="text-[10px] font-normal text-gray-400">من 50</span></th>
              <th className="text-center w-20">المجموع</th>
              <th className="text-center w-20">التقدير</th>
              <th className="text-center w-20">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.length===0&&<tr><td colSpan={8} className="text-center py-10 text-gray-400 text-sm">لا يوجد طلاب مسجّلون</td></tr>}
            {enrollments.map(enr=>{
              const student=enr.student; const profile=student?.profile;
              const g=grades[enr.id]??{participation:0,assignments:0,midterm:0,final:0};
              const total=calcGradeTotal({participation:g.participation,assignments:g.assignments,midterm:g.midterm,final:g.final});
              const letterInfo=getLetterGrade(total);
              const isPublished=enr.grade?.[0]?.is_published;
              const InputCell=({field,max}:{field:keyof Omit<GradeRow,'enrollment_id'>;max:number})=>(
                <td className="text-center p-1">
                  <input type="number" min={0} max={max} step={0.5} value={g[field]} disabled={isPublished}
                    onChange={e=>update(enr.id,field,Math.min(max,Math.max(0,parseFloat(e.target.value)||0)))}
                    className={cn('w-16 text-center rounded-lg border py-1.5 text-sm font-medium transition-colors',isPublished?'bg-gray-50 text-gray-400 border-transparent':'border-gray-200 bg-white hover:border-primary-300 focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-200')}/>
                </td>
              );
              return (
                <tr key={enr.id}>
                  <td>
                    <p className="text-sm font-medium text-gray-800">{isRTL?profile?.full_name_ar??profile?.full_name:profile?.full_name}</p>
                    <p className="text-xs text-gray-400 font-mono">{student?.student_number}</p>
                  </td>
                  <InputCell field="participation" max={10}/>
                  <InputCell field="assignments" max={10}/>
                  <InputCell field="midterm" max={30}/>
                  <InputCell field="final" max={50}/>
                  <td className="text-center"><span className={cn('text-sm font-bold',gradeColor(letterInfo.letter as any))}>{total.toFixed(1)}</span></td>
                  <td className="text-center"><span className={cn('text-base font-black',gradeColor(letterInfo.letter as any))}>{letterInfo.letter}</span></td>
                  <td className="text-center">{isPublished?<span className="badge-green badge text-[10px]">منشور</span>:<span className="badge-yellow badge text-[10px]">غير منشور</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal open={publishModal} title="نشر الدرجات" desc="سيتم نشر جميع الدرجات وإشعار الطلاب. لا يمكن التراجع عن النشر."
        confirmLabel="نشر الدرجات" danger={false} onConfirm={publishAll} onCancel={()=>setPublishModal(false)} loading={publishing}/>
    </div>
  );
}
