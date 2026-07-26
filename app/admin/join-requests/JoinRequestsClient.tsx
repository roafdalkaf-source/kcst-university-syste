'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/shared';
import { fRelative, getInitials, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
const ROLE_AR:Record<string,string>={ student:'طالب',professor:'أستاذ',teaching_assistant:'مساعد تدريس',registrar:'مسجّل',finance_officer:'موظف مالية',department_head:'رئيس قسم',dean:'عميد',university_admin:'مدير جامعة' };
export function JoinRequestsClient({ requests, adminId }: { requests:any[]; adminId:string }) {
  const { i18n } = useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [processing,setProcessing]=useState<string|null>(null);
  const [rejectModal,setRejectModal]=useState<{req:any;reason:string}|null>(null);
  const [filter,setFilter]=useState<'pending'|'approved'|'rejected'|'all'>('pending');

  const approve=async(req:any)=>{ setProcessing(req.id);
    await sb.from('user_roles').insert({user_id:req.user_id,role:req.requested_role,granted_by:adminId});
    await sb.from('join_requests').update({status:'approved',reviewed_by:adminId,reviewed_at:new Date().toISOString()}).eq('id',req.id);
    await sb.from('notifications').insert({user_id:req.user_id,type:'join_request_approved',title_ar:'تمت الموافقة على طلبك',title_en:'Your request was approved',body_ar:`تم منحك دور: ${ROLE_AR[req.requested_role]??req.requested_role}`,body_en:`Role granted: ${req.requested_role}`,link:'/'});
    toast.success('تمت الموافقة'); setProcessing(null); router.refresh(); };

  const reject=async()=>{ if(!rejectModal) return; setProcessing(rejectModal.req.id);
    await sb.from('join_requests').update({status:'rejected',reviewed_by:adminId,reviewed_at:new Date().toISOString(),rejection_reason:rejectModal.reason||null}).eq('id',rejectModal.req.id);
    await sb.from('notifications').insert({user_id:rejectModal.req.user_id,type:'join_request_rejected',title_ar:'تم رفض طلبك',title_en:'Your request was rejected',body_ar:rejectModal.reason||'تواصل مع الإدارة',body_en:rejectModal.reason||'Contact administration'});
    toast.success('تم الرفض'); setRejectModal(null); setProcessing(null); router.refresh(); };

  const filtered=filter==='all'?requests:requests.filter(r=>r.status===filter);
  const pending=requests.filter(r=>r.status==='pending').length;
  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <PageHeader title="طلبات الانضمام" description={pending>0?`${pending} طلب ينتظر المراجعة`:'لا توجد طلبات معلقة'} breadcrumbs={[{label:'الإدارة'},{label:'طلبات الانضمام'}]}/>
      <div className="flex gap-2 flex-wrap">
        {[{k:'pending' as const,label:`معلق (${requests.filter(r=>r.status==='pending').length})`},{k:'approved' as const,label:`موافق (${requests.filter(r=>r.status==='approved').length})`},{k:'rejected' as const,label:`مرفوض (${requests.filter(r=>r.status==='rejected').length})`},{k:'all' as const,label:`الكل (${requests.length})`}].map(t=>(
          <button key={t.k} onClick={()=>setFilter(t.k)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',filter===t.k?'bg-primary-500 text-white border-primary-500':'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>{t.label}</button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length===0&&<div className="card p-10 text-center"><Clock className="w-8 h-8 text-gray-300 mx-auto mb-2"/><p className="text-sm text-gray-400">لا توجد طلبات في هذه الفئة</p></div>}
        {filtered.map(req=>{
          const p=req.user; const isPending=req.status==='pending';
          return (
            <div key={req.id} className={cn('card p-5 flex items-start gap-4',isPending&&'border-amber-200')}>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 shrink-0">{getInitials(p?.full_name??'U')}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap mb-2">
                  <div><p className="text-sm font-bold text-gray-800">{isRTL?(p?.full_name_ar??p?.full_name):p?.full_name}</p><p className="text-xs text-gray-400">{p?.email}</p></div>
                  <div className="flex items-center gap-2">
                    <span className="badge-accent badge">{ROLE_AR[req.requested_role]??req.requested_role}</span>
                    <span className={cn('badge',req.status==='approved'?'badge-green':req.status==='rejected'?'badge-red':'badge-yellow')}>{req.status==='approved'?'موافق':req.status==='rejected'?'مرفوض':'معلق'}</span>
                  </div>
                </div>
                {req.motivation&&<p className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mb-2">{req.motivation}</p>}
                {req.rejection_reason&&<p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2">سبب الرفض: {req.rejection_reason}</p>}
                <p className="text-[10px] text-gray-400">{fRelative(req.created_at,isRTL?'ar':'en')}</p>
              </div>
              {isPending&&(
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={()=>approve(req)} disabled={processing===req.id} className="btn-success py-1.5 px-3 text-xs">
                    {processing===req.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<CheckCircle className="w-3.5 h-3.5"/>}موافقة</button>
                  <button onClick={()=>setRejectModal({req,reason:''})} disabled={processing===req.id} className="btn py-1.5 px-3 text-xs bg-red-50 text-red-600 hover:bg-red-100">
                    <XCircle className="w-3.5 h-3.5"/>رفض</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {rejectModal&&(
        <div className="modal-backdrop"><div className="modal-box p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">رفض الطلب</h2>
          <p className="text-sm text-gray-500 mb-4">{rejectModal.req.user?.full_name}</p>
          <textarea value={rejectModal.reason} onChange={e=>setRejectModal(m=>m?{...m,reason:e.target.value}:null)} rows={3} placeholder="سبب الرفض (اختياري)..." className="input resize-none mb-4"/>
          <div className="flex gap-3">
            <button onClick={()=>setRejectModal(null)} className="btn-secondary flex-1">إلغاء</button>
            <button onClick={reject} disabled={!!processing} className="btn-danger flex-1">{processing&&<Loader2 className="w-4 h-4 animate-spin"/>}تأكيد الرفض</button>
          </div>
        </div></div>
      )}
    </div>
  );
}
