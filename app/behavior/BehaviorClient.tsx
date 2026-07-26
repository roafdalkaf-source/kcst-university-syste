'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { AlertTriangle, Plus, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState, ConfirmModal } from '@/components/shared';
import { fDate, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const TYPES = [
  {value:'warning',    label:'تحذير',            cls:'badge-yellow'},
  {value:'suspension', label:'إيقاف مؤقت',        cls:'badge-red'},
  {value:'commendation',label:'شهادة تقدير',     cls:'badge-green'},
  {value:'misconduct', label:'سلوك مخالف',        cls:'badge-red'},
  {value:'other',      label:'أخرى',              cls:'badge-gray'},
];

export function BehaviorClient({ records, students, userId }: { records: any[]; students: any[]; userId: string }) {
  const { i18n } = useTranslation(); const isRTL = i18n.language === 'ar';
  const router   = useRouter(); const sb = createClient();
  const [modal, setModal]     = useState(false);
  const [search, setSearch]   = useState('');
  const [delTarget, setDel]   = useState<any>(null);
  const [saving, setSaving]   = useState(false);
  const { register, handleSubmit, reset, formState:{errors} } = useForm<any>({
    defaultValues:{ type:'warning', severity:3 }
  });

  const onSubmit = async (data: any) => {
    setSaving(true);
    const { error } = await sb.from('behavior_records').insert({
      student_id:    data.student_id,
      type:          data.type,
      title:         data.title,
      description:   data.description || null,
      severity:      parseInt(data.severity),
      incident_date: data.incident_date || new Date().toISOString().split('T')[0],
      recorded_by:   userId,
    });
    setSaving(false);
    if (error) { toast.error('فشل الحفظ'); return; }
    toast.success('تم تسجيل الملاحظة السلوكية');
    setModal(false); reset(); router.refresh();
  };

  const doDelete = async () => {
    if (!delTarget) return; setSaving(true);
    await sb.from('behavior_records').delete().eq('id', delTarget.id);
    setSaving(false); toast.success('تم الحذف'); setDel(null); router.refresh();
  };

  const filtered = records.filter(r => {
    const name = isRTL ? r.student?.profile?.full_name_ar ?? r.student?.profile?.full_name : r.student?.profile?.full_name;
    return !search || name?.toLowerCase().includes(search.toLowerCase()) || r.title?.includes(search);
  });

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="السجل السلوكي" description={`${records.length} سجل`}
        breadcrumbs={[{label:'الإدارة'},{label:'السلوك'}]}
        actions={<button onClick={()=>setModal(true)} className="btn-primary"><Plus className="w-4 h-4"/>تسجيل ملاحظة</button>}/>

      <div className="grid grid-cols-4 gap-3">
        {TYPES.filter(t=>t.value!=='other').map(t=>(
          <div key={t.value} className="card p-3 text-center">
            <p className="text-2xl font-bold text-text-primary">{records.filter(r=>r.type===t.value).length}</p>
            <p className="text-xs text-text-muted mt-0.5">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="relative w-72">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"/>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث بالاسم..." className="input ps-9 text-sm"/>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد سجلات سلوكية"/>
      ) : (
        <div className="space-y-2">
          {filtered.map(r=>{
            const typeCfg = TYPES.find(t=>t.value===r.type) ?? TYPES[TYPES.length-1];
            const studentName = isRTL ? r.student?.profile?.full_name_ar??r.student?.profile?.full_name : r.student?.profile?.full_name;
            const isNeg = ['warning','suspension','misconduct'].includes(r.type);
            return(
              <div key={r.id} className={cn('card p-4 flex items-start gap-4', isNeg&&'border-red-200 bg-red-50/20')}>
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0',
                  isNeg ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200')}>
                  {isNeg?'⚠️':'⭐'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className={cn('badge text-[10px]', typeCfg.cls)}>{typeCfg.label}</span>
                        <span className="text-sm font-bold text-text-primary">{r.title}</span>
                      </div>
                      <p className="text-xs text-text-muted">{studentName} • {r.student?.student_number}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-text-muted">{fDate(r.incident_date, isRTL?'ar':'en')}</span>
                      <button onClick={()=>setDel(r)} className="btn-ghost p-1.5 hover:text-red-500">
                        <X className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                  {r.description&&<p className="text-xs text-text-muted mt-1.5 leading-relaxed">{r.description}</p>}
                  {r.severity&&(
                    <div className="flex items-center gap-1 mt-2">
                      {Array.from({length:5}).map((_,i)=>(
                        <div key={i} className={cn('w-5 h-1.5 rounded-full transition-colors',
                          i<r.severity ? (isNeg?'bg-red-400':'bg-green-400') : 'bg-surface-overlay')}/>
                      ))}
                      <span className="text-[10px] text-text-muted ms-1">الشدة {r.severity}/5</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal&&(
        <div className="modal-backdrop"><div className="modal-box p-6 max-w-lg" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-bold text-text-primary">تسجيل ملاحظة سلوكية</h2>
            <button onClick={()=>setModal(false)} className="btn-ghost p-1.5"><X className="w-4 h-4"/></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><label className="label">الطالب *</label>
              <select {...register('student_id',{required:true})} className="input">
                <option value="">اختر طالباً...</option>
                {students.map(s=><option key={s.id} value={s.id}>{isRTL?s.profile?.full_name_ar??s.profile?.full_name:s.profile?.full_name} — {s.student_number}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">النوع *</label>
                <select {...register('type')} className="input">
                  {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div><label className="label">تاريخ الحادثة</label>
                <input {...register('incident_date')} type="date" className="input"/>
              </div>
            </div>
            <div><label className="label">العنوان *</label>
              <input {...register('title',{required:true})} className="input" placeholder="وصف مختصر..."/>
            </div>
            <div><label className="label">التفاصيل</label>
              <textarea {...register('description')} rows={3} className="input resize-none"/>
            </div>
            <div><label className="label">مستوى الشدة (1-5)</label>
              <input {...register('severity')} type="range" min={1} max={5} className="w-full accent-primary-500"/>
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={()=>setModal(false)} className="btn-secondary flex-1">إلغاء</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving&&<Loader2 className="w-4 h-4 animate-spin"/>}تسجيل
              </button>
            </div>
          </form>
        </div></div>
      )}

      <ConfirmModal open={!!delTarget} title="حذف السجل السلوكي"
        desc={`سيتم حذف "${delTarget?.title}" نهائياً.`}
        confirmLabel="حذف" onConfirm={doDelete} onCancel={()=>setDel(null)} loading={saving}/>
    </div>
  );
}
