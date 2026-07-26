'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Plus, CreditCard, ChevronDown, ChevronRight, Loader2, Search, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, StatCard } from '@/components/shared';
import { fCurrency, fDate, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const paySchema=z.object({amount:z.number().min(1,'المبلغ مطلوب'),method:z.enum(['cash','bank_transfer','card','mobile_money','waiver']),reference_no:z.string().optional(),notes:z.string().optional()});
type PayF=z.infer<typeof paySchema>;
const STATUS_BADGE:Record<string,string>={pending:'badge-yellow',partial:'badge-yellow',paid:'badge-green',overdue:'badge-red',cancelled:'badge-gray',waived:'badge-gray'};
const STATUS_AR:Record<string,string>={pending:'معلق',partial:'جزئي',paid:'مدفوع',overdue:'متأخر',cancelled:'ملغي',waived:'معفو'};
const METHOD_AR:Record<string,string>={cash:'نقداً',bank_transfer:'تحويل بنكي',card:'بطاقة',mobile_money:'محفظة',waiver:'إعفاء'};

export function FinanceClient({ invoices, stats, userId }: { invoices:any[];stats:{totalRevenue:number;totalPending:number;overdueCount:number;paidCount:number};userId:string }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [search,setSearch]=useState('');
  const [statusFilter,setStatusFilter]=useState('all');
  const [expanded,setExpanded]=useState<string|null>(null);
  const [payModal,setPayModal]=useState<any>(null);
  const [saving,setSaving]=useState(false);

  const { register,handleSubmit,reset,formState:{errors} }=useForm<PayF>({resolver:zodResolver(paySchema),defaultValues:{method:'cash'}});

  const filtered=invoices.filter(inv=>{
    const matchSearch=!search||inv.invoice_no?.toLowerCase().includes(search.toLowerCase())||inv.student?.profile?.full_name?.toLowerCase().includes(search.toLowerCase())||inv.student?.student_number?.includes(search);
    const matchStatus=statusFilter==='all'||inv.status===statusFilter;
    return matchSearch&&matchStatus;
  });

  const recordPayment=async(data:PayF)=>{ if(!payModal) return; setSaving(true);
    const {error}=await sb.from('payments').insert({invoice_id:payModal.id,amount:data.amount,method:data.method,reference_no:data.reference_no||null,notes:data.notes||null,received_by:userId,paid_at:new Date().toISOString()});
    setSaving(false); if(error){toast.error('فشل تسجيل الدفعة');return;}
    toast.success(`تم تسجيل دفعة ${fCurrency(data.amount)}`); setPayModal(null); reset(); router.refresh(); };

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="إدارة المالية" description={`${invoices.length} فاتورة`} breadcrumbs={[{label:'المالية'}]}/>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="الإيرادات المحصّلة" value={fCurrency(stats.totalRevenue)} icon={CheckCircle2} iconClass="text-green-600"/>
        <StatCard title="الرصيد المعلق" value={fCurrency(stats.totalPending)} icon={AlertCircle} iconClass="text-amber-500"/>
        <StatCard title="فواتير متأخرة" value={stats.overdueCount} icon={AlertCircle} iconClass="text-red-500"/>
        <StatCard title="فواتير مدفوعة" value={stats.paidCount} icon={CheckCircle2} iconClass="text-green-600"/>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث برقم الفاتورة أو اسم الطالب..." className="input ps-9 text-sm"/></div>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="input w-36 text-sm">
          <option value="all">الكل</option>{Object.entries(STATUS_AR).map(([v,l])=><option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Invoices list */}
      <div className="space-y-2">
        {filtered.length===0&&<div className="card p-10 text-center"><DollarSign className="w-8 h-8 text-gray-200 mx-auto mb-2"/><p className="text-sm text-gray-400">لا توجد فواتير</p></div>}
        {filtered.map(inv=>{
          const isOpen=expanded===inv.id;
          const student=inv.student; const profile=student?.profile;
          const name=isRTL?profile?.full_name_ar??profile?.full_name:profile?.full_name;
          return (
            <div key={inv.id} className={cn('card overflow-hidden',inv.status==='overdue'&&'border-red-200')}>
              <button onClick={()=>setExpanded(isOpen?null:inv.id)} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono text-primary-600">{inv.invoice_no}</span>
                    <span className={cn('badge text-[10px]',STATUS_BADGE[inv.status])}>{STATUS_AR[inv.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{name} • {student?.student_number}</p>
                  {inv.due_date&&<p className={cn('text-[10px] mt-0.5',new Date(inv.due_date)<new Date()&&inv.status!=='paid'?'text-red-500':'text-gray-400')}>الاستحقاق: {fDate(inv.due_date,isRTL?'ar':'en')}</p>}
                </div>
                <div className="text-end shrink-0">
                  <p className="text-sm font-bold text-gray-800">{fCurrency(inv.total_amount)}</p>
                  {inv.balance>0&&<p className="text-xs text-red-500 font-medium">متبقي: {fCurrency(inv.balance)}</p>}
                </div>
                {isOpen?<ChevronDown className="w-4 h-4 text-gray-300 shrink-0"/>:<ChevronRight className="w-4 h-4 text-gray-300 shrink-0"/>}
              </button>
              {isOpen&&(
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 animate-fade-in">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[{l:'الإجمالي',v:inv.total_amount,c:'text-gray-700'},{l:'المدفوع',v:inv.paid_amount,c:'text-green-600'},{l:'الرصيد',v:inv.balance,c:inv.balance>0?'text-red-500':'text-green-600'}].map(item=>(
                      <div key={item.l} className="text-center p-2.5 rounded-xl bg-white border border-gray-100"><p className={cn('text-sm font-bold',item.c)}>{fCurrency(item.v)}</p><p className="text-[10px] text-gray-400">{item.l}</p></div>
                    ))}
                  </div>
                  {/* Payments */}
                  <p className="text-xs font-semibold text-gray-500 mb-2">سجل الدفعات</p>
                  {(inv.payments??[]).length===0?<p className="text-xs text-gray-400 text-center py-2">لا توجد دفعات</p>:(
                    <div className="space-y-1.5 mb-4">
                      {inv.payments.map((p:any)=>(
                        <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-gray-100 text-xs">
                          <div><span className="font-medium text-gray-700">{METHOD_AR[p.method]}</span>{p.reference_no&&<span className="text-gray-400 ms-2 font-mono">{p.reference_no}</span>}</div>
                          <div className="text-end"><span className="font-bold text-green-600">{fCurrency(p.amount)}</span><p className="text-[10px] text-gray-400">{fDate(p.paid_at,isRTL?'ar':'en')}</p></div>
                        </div>
                      ))}
                    </div>
                  )}
                  {inv.balance>0&&inv.status!=='cancelled'&&(
                    <button onClick={()=>{setPayModal(inv);reset({amount:inv.balance,method:'cash'});}} className="btn-primary text-sm w-full"><CreditCard className="w-4 h-4"/>تسجيل دفعة</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment modal */}
      {payModal&&(
        <div className="modal-backdrop"><div className="modal-box p-6 max-w-sm" onClick={e=>e.stopPropagation()}>
          <h2 className="text-base font-bold text-gray-900 mb-1">تسجيل دفعة</h2>
          <p className="text-sm text-gray-500 mb-4">{payModal.invoice_no} • الرصيد: {fCurrency(payModal.balance)}</p>
          <form onSubmit={handleSubmit(recordPayment)} className="space-y-4">
            <div><label className="label">المبلغ *</label><input {...register('amount',{valueAsNumber:true})} type="number" min={1} max={payModal.balance} step="0.01" className={cn('input',errors.amount&&'input-error')}/>{errors.amount&&<p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>}</div>
            <div><label className="label">طريقة الدفع *</label><select {...register('method')} className="input"><option value="cash">نقداً</option><option value="bank_transfer">تحويل بنكي</option><option value="card">بطاقة</option><option value="mobile_money">محفظة</option><option value="waiver">إعفاء</option></select></div>
            <div><label className="label">رقم المرجع</label><input {...register('reference_no')} placeholder="REF-001..." className="input font-mono text-sm"/></div>
            <div><label className="label">ملاحظات</label><textarea {...register('notes')} rows={2} className="input resize-none"/></div>
            <div className="flex gap-3 pt-1"><button type="button" onClick={()=>setPayModal(null)} className="btn-secondary flex-1">إلغاء</button><button type="submit" disabled={saving} className="btn-primary flex-1">{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}تسجيل</button></div>
          </form>
        </div></div>
      )}
    </div>
  );
}
