'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Layers, GraduationCap, ChevronDown, ChevronRight, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, ConfirmModal } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
const DEGREE_AR:Record<string,string>={diploma:'دبلوم',bachelor:'بكالوريوس',master:'ماجستير',phd:'دكتوراه'};
export function StructureClient({ faculties, adminId }: { faculties:any[]; adminId:string }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [open,setOpen]=useState<Record<string,boolean>>({});
  const [delTarget,setDelTarget]=useState<{table:string;id:string;name:string}|null>(null);
  const [saving,setSaving]=useState(false);
  const [modal,setModal]=useState<{kind:'faculty'|'dept'|'prog';parent?:any;edit?:any}|null>(null);
  const [form,setForm]=useState<any>({});
  const toggle=(id:string)=>setOpen(p=>({...p,[id]:!p[id]}));
  const doDelete=async()=>{
    if(!delTarget) return; setSaving(true);
    const {error}=await sb.from(delTarget.table as any).delete().eq('id',delTarget.id);
    setSaving(false); if(error){toast.error('لا يمكن الحذف — توجد بيانات مرتبطة');return;}
    toast.success('تم الحذف'); setDelTarget(null); router.refresh();
  };
  const saveEntity=async()=>{
    if(!modal) return; setSaving(true);
    const table=modal.kind==='faculty'?'faculties':modal.kind==='dept'?'departments':'programs';
    const payload={...form,...(modal.kind==='dept'?{faculty_id:modal.parent?.id}:modal.kind==='prog'?{department_id:modal.parent?.id}:{})};
    const {error}=modal.edit?await sb.from(table as any).update(payload).eq('id',modal.edit.id):await sb.from(table as any).insert(payload);
    setSaving(false); if(error){toast.error(error.message);return;}
    toast.success(modal.edit?'تم التحديث':'تمت الإضافة'); setModal(null); setForm({}); router.refresh();
  };
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="الهيكل الأكاديمي" description={`${faculties.length} كلية`} breadcrumbs={[{label:'الإدارة'},{label:'الهيكل الأكاديمي'}]}
        actions={<button onClick={()=>{setModal({kind:'faculty'});setForm({});}} className="btn-primary"><Plus className="w-4 h-4"/>إضافة كلية</button>}/>
      {faculties.length===0&&<div className="card p-12 text-center"><Building2 className="w-10 h-10 text-gray-200 mx-auto mb-3"/><p className="text-sm text-gray-400">أضف كليتك الأولى للبدء</p></div>}
      <div className="space-y-3">
        {faculties.map(fac=>(
          <div key={fac.id} className="card overflow-hidden">
            <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={()=>toggle(fac.id)}>
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0"><Building2 className="w-5 h-5 text-primary-500"/></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="badge-blue badge font-mono text-[10px]">{fac.code}</span><p className="text-sm font-bold text-gray-800">{isRTL?fac.name_ar:fac.name_en}</p></div>
                <p className="text-xs text-gray-400 mt-0.5">{fac.departments?.length??0} أقسام</p>
              </div>
              <div className="flex items-center gap-1" onClick={e=>e.stopPropagation()}>
                <button onClick={()=>{setModal({kind:'faculty',edit:fac});setForm({name_ar:fac.name_ar,name_en:fac.name_en,code:fac.code,description:fac.description});}} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5"/></button>
                <button onClick={()=>setDelTarget({table:'faculties',id:fac.id,name:fac.name_ar})} className="btn-ghost p-1.5 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                <button onClick={()=>{setModal({kind:'dept',parent:fac});setForm({});}} className="btn-ghost p-1.5 hover:text-green-600"><Plus className="w-3.5 h-3.5"/></button>
              </div>
              {open[fac.id]?<ChevronDown className="w-4 h-4 text-gray-400 shrink-0"/>:<ChevronRight className="w-4 h-4 text-gray-400 shrink-0"/>}
            </div>
            {open[fac.id]&&(
              <div className={cn('border-t border-gray-100 ms-5',isRTL?'border-r-2 border-r-primary-100':'border-l-2 border-l-primary-100')}>
                {(fac.departments??[]).map((dept:any)=>(
                  <div key={dept.id}>
                    <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50/70" onClick={()=>toggle(dept.id)}>
                      <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Layers className="w-4 h-4 text-accent-600"/></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><span className="font-mono text-[10px] text-gray-400 bg-gray-100 px-1 rounded">{dept.code}</span><p className="text-sm font-semibold text-gray-700">{isRTL?dept.name_ar:dept.name_en}</p></div>
                        <p className="text-xs text-gray-400">{dept.programs?.length??0} برامج</p>
                      </div>
                      <div className="flex items-center gap-1" onClick={e=>e.stopPropagation()}>
                        <button onClick={()=>setDelTarget({table:'departments',id:dept.id,name:dept.name_ar})} className="btn-ghost p-1 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                        <button onClick={()=>{setModal({kind:'prog',parent:dept});setForm({degree_level:'bachelor',duration_years:4,total_credits:120});}} className="btn-ghost p-1 hover:text-green-600"><Plus className="w-3 h-3"/></button>
                      </div>
                      {open[dept.id]?<ChevronDown className="w-3.5 h-3.5 text-gray-300"/>:<ChevronRight className="w-3.5 h-3.5 text-gray-300"/>}
                    </div>
                    {open[dept.id]&&(
                      <div className={cn('ms-8',isRTL?'border-r border-r-accent/20':'border-l border-l-accent/20')}>
                        {(dept.programs??[]).map((prog:any)=>(
                          <div key={prog.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/50">
                            <GraduationCap className="w-4 h-4 text-gray-300 shrink-0"/>
                            <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-700">{isRTL?prog.name_ar:prog.name_en}</p><p className="text-[10px] text-gray-400">{DEGREE_AR[prog.degree_level]} • {prog.total_credits} ساعة • {prog.duration_years} سنوات</p></div>
                            <button onClick={()=>setDelTarget({table:'programs',id:prog.id,name:prog.name_ar})} className="btn-ghost p-1 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                          </div>
                        ))}
                        {(dept.programs??[]).length===0&&<p className="text-xs text-gray-400 px-4 py-2">لا توجد برامج</p>}
                      </div>
                    )}
                  </div>
                ))}
                {(fac.departments??[]).length===0&&<p className="text-xs text-gray-400 px-4 py-3">لا توجد أقسام — أضف قسماً</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Simple modal for create/edit */}
      {modal&&(
        <div className="modal-backdrop"><div className="modal-box p-6" onClick={e=>e.stopPropagation()}>
          <h2 className="text-base font-bold text-gray-900 mb-5">{modal.edit?'تعديل':'إضافة'} {modal.kind==='faculty'?'كلية':modal.kind==='dept'?'قسم':'برنامج'}</h2>
          <div className="space-y-4">
            {modal.kind!=='prog'&&<><div><label className="label">الكود *</label><input value={form.code??''} onChange={e=>setForm((p:any)=>({...p,code:e.target.value.toUpperCase()}))} className="input uppercase" placeholder="FCIT"/></div>
            <div><label className="label">الاسم العربي *</label><input value={form.name_ar??''} onChange={e=>setForm((p:any)=>({...p,name_ar:e.target.value}))} className="input"/></div>
            <div><label className="label">الاسم الإنجليزي *</label><input value={form.name_en??''} onChange={e=>setForm((p:any)=>({...p,name_en:e.target.value}))} className="input"/></div></>}
            {modal.kind==='prog'&&<><div><label className="label">الكود *</label><input value={form.code??''} onChange={e=>setForm((p:any)=>({...p,code:e.target.value.toUpperCase()}))} className="input uppercase"/></div>
            <div><label className="label">الاسم العربي *</label><input value={form.name_ar??''} onChange={e=>setForm((p:any)=>({...p,name_ar:e.target.value}))} className="input"/></div>
            <div><label className="label">الاسم الإنجليزي *</label><input value={form.name_en??''} onChange={e=>setForm((p:any)=>({...p,name_en:e.target.value}))} className="input"/></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">الدرجة</label><select value={form.degree_level??'bachelor'} onChange={e=>setForm((p:any)=>({...p,degree_level:e.target.value}))} className="input"><option value="diploma">دبلوم</option><option value="bachelor">بكالوريوس</option><option value="master">ماجستير</option><option value="phd">دكتوراه</option></select></div>
              <div><label className="label">السنوات</label><input type="number" value={form.duration_years??4} onChange={e=>setForm((p:any)=>({...p,duration_years:+e.target.value}))} className="input"/></div>
              <div><label className="label">الساعات</label><input type="number" value={form.total_credits??120} onChange={e=>setForm((p:any)=>({...p,total_credits:+e.target.value}))} className="input"/></div>
            </div></>}
          </div>
          <div className="flex gap-3 mt-5"><button onClick={()=>setModal(null)} className="btn-secondary flex-1">إلغاء</button><button onClick={saveEntity} disabled={saving} className="btn-primary flex-1">{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}حفظ</button></div>
        </div></div>
      )}
      <ConfirmModal open={!!delTarget} title="تأكيد الحذف" desc={`سيتم حذف "${delTarget?.name}" نهائياً.`} confirmLabel="حذف" onConfirm={doDelete} onCancel={()=>setDelTarget(null)} loading={saving}/>
    </div>
  );
}
