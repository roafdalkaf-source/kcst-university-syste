'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Calendar, CheckCircle2, Archive, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, ConfirmModal } from '@/components/shared';
import { fDate, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const schema=z.object({name_ar:z.string().min(2,'مطلوب'),name_en:z.string().min(2,'Required'),academic_year:z.string().regex(/^\d{4}-\d{4}$/,'مثال: 2024-2025'),term:z.enum(['fall','spring','summer']),start_date:z.string().min(1),end_date:z.string().min(1),reg_start:z.string().optional(),reg_end:z.string().optional(),grade_deadline:z.string().optional()});
type F=z.infer<typeof schema>;
const TERM_AR:Record<string,string>={fall:'خريف',spring:'ربيع',summer:'صيف'};

export function CalendarClient({ semesters, adminId }: { semesters:any[]; adminId:string }) {
  const router=useRouter(); const sb=createClient();
  const [modal,setModal]=useState(false);
  const [activateTarget,setAct]=useState<any>(null);
  const [archiveTarget,setArch]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const { register,handleSubmit,reset,formState:{errors} }=useForm<F>({resolver:zodResolver(schema),defaultValues:{term:'fall'}});

  const onSubmit=async(data:F)=>{ setSaving(true);
    const {error}=await sb.from('semesters').insert({...data,reg_start:data.reg_start||null,reg_end:data.reg_end||null,grade_deadline:data.grade_deadline||null});
    setSaving(false); if(error){toast.error(error.message);return;} toast.success('تمت إضافة الفصل الدراسي'); setModal(false); reset(); router.refresh(); };

  const activateSemester=async()=>{ if(!activateTarget) return; setSaving(true);
    await sb.from('semesters').update({is_active:false}).neq('id',activateTarget.id);
    await sb.from('semesters').update({is_active:true}).eq('id',activateTarget.id);
    setSaving(false); toast.success(`تم تفعيل ${activateTarget.name_ar}`); setAct(null); router.refresh(); };

  const archiveSemester=async()=>{ if(!archiveTarget) return; setSaving(true);
    await sb.from('semesters').update({is_archived:true,is_active:false}).eq('id',archiveTarget.id);
    setSaving(false); toast.success('تم أرشفة الفصل'); setArch(null); router.refresh(); };

  const active=semesters.find(s=>s.is_active);
  const upcoming=semesters.filter(s=>!s.is_active&&!s.is_archived);
  const archived=semesters.filter(s=>s.is_archived);

  const SemCard=({ sem }: { sem:any })=>(
    <div className={cn('card p-5',sem.is_active&&'border-green-300 bg-green-50/30',sem.is_archived&&'opacity-60')}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {sem.is_active&&<span className="badge-green badge text-[10px]">نشط</span>}
            <span className="badge-gray badge text-[10px]">{TERM_AR[sem.term]}</span>
            <span className="text-xs text-gray-400">{sem.academic_year}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800">{sem.name_ar}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!sem.is_active&&!sem.is_archived&&<button onClick={()=>setAct(sem)} className="btn-ghost p-1.5 text-xs text-green-600 hover:bg-green-50"><CheckCircle2 className="w-4 h-4"/></button>}
          {!sem.is_archived&&<button onClick={()=>setArch(sem)} className="btn-ghost p-1.5 text-xs text-gray-400 hover:bg-gray-100"><Archive className="w-4 h-4"/></button>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div><p className="text-gray-400">الفترة</p><p className="font-medium text-gray-700">{fDate(sem.start_date,'ar')} ← {fDate(sem.end_date,'ar')}</p></div>
        {sem.grade_deadline&&<div><p className="text-gray-400">موعد الدرجات</p><p className="font-medium text-gray-700">{fDate(sem.grade_deadline,'ar')}</p></div>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <PageHeader title="التقويم الأكاديمي" description={`${semesters.length} فصل دراسي`} breadcrumbs={[{label:'الشؤون الأكاديمية'},{label:'التقويم'}]}
        actions={<button onClick={()=>setModal(true)} className="btn-primary"><Plus className="w-4 h-4"/>فصل جديد</button>}/>
      {active&&(<div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">الفصل النشط</p><SemCard sem={active}/></div>)}
      {upcoming.length>0&&(<div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">فصول قادمة ({upcoming.length})</p><div className="space-y-3">{upcoming.map(s=><SemCard key={s.id} sem={s}/>)}</div></div>)}
      {archived.length>0&&(<div><p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">مؤرشفة ({archived.length})</p><div className="space-y-3">{archived.slice(0,3).map(s=><SemCard key={s.id} sem={s}/>)}</div></div>)}
      {semesters.length===0&&<div className="card p-12 text-center"><Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3"/><p className="text-sm text-gray-400">لا توجد فصول دراسية — أضف فصلاً للبدء</p></div>}

      {modal&&(
        <div className="modal-backdrop"><div className="modal-box p-6 max-w-lg" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5"><h2 className="text-base font-bold text-gray-900">فصل دراسي جديد</h2><button onClick={()=>setModal(false)} className="btn-ghost p-1.5"><X className="w-4 h-4"/></button></div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">الاسم العربي *</label><input {...register('name_ar')} placeholder="الخريف 2025" className={cn('input',errors.name_ar&&'input-error')}/>{errors.name_ar&&<p className="text-xs text-red-500 mt-1">{errors.name_ar.message}</p>}</div>
              <div><label className="label">الاسم الإنجليزي *</label><input {...register('name_en')} placeholder="Fall 2025" className={cn('input',errors.name_en&&'input-error')}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">العام الدراسي *</label><input {...register('academic_year')} placeholder="2025-2026" className="input"/>{errors.academic_year&&<p className="text-xs text-red-500 mt-1">{errors.academic_year.message}</p>}</div>
              <div><label className="label">الفصل *</label><select {...register('term')} className="input"><option value="fall">خريف</option><option value="spring">ربيع</option><option value="summer">صيف</option></select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">تاريخ البداية *</label><input {...register('start_date')} type="date" className="input"/></div>
              <div><label className="label">تاريخ الانتهاء *</label><input {...register('end_date')} type="date" className="input"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">بداية التسجيل</label><input {...register('reg_start')} type="date" className="input"/></div>
              <div><label className="label">نهاية التسجيل</label><input {...register('reg_end')} type="date" className="input"/></div>
            </div>
            <div><label className="label">موعد إدخال الدرجات</label><input {...register('grade_deadline')} type="date" className="input"/></div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">إلغاء</button><button type="submit" disabled={saving} className="btn-primary flex-1">{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}إضافة</button></div>
          </form>
        </div></div>
      )}
      <ConfirmModal open={!!activateTarget} title="تفعيل الفصل الدراسي" desc={`سيتم تفعيل "${activateTarget?.name_ar}" وإلغاء تفعيل الفصل الحالي إن وجد.`} confirmLabel="تفعيل" danger={false} onConfirm={activateSemester} onCancel={()=>setAct(null)} loading={saving}/>
      <ConfirmModal open={!!archiveTarget} title="أرشفة الفصل الدراسي" desc={`سيتم أرشفة "${archiveTarget?.name_ar}".`} confirmLabel="أرشفة" danger={false} onConfirm={archiveSemester} onCancel={()=>setArch(null)} loading={saving}/>
    </div>
  );
}
