'use client';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState } from '@/components/shared';
import { fRelative, cn } from '@/lib/utils';
import Link from 'next/link';

const TYPE_ICON: Record<string,string> = { grade_published:'📊',invoice_created:'🧾',invoice_paid:'✅',join_request_approved:'🎉',join_request_rejected:'❌',behavior_recorded:'⚠️',certificate_issued:'🏅',announcement:'📢',broadcast:'📣' };

export function NotificationsClient({ notifications:init, userId }: { notifications:any[]; userId:string }) {
  const { i18n } = useTranslation(); const isRTL=i18n.language==='ar';
  const sb=createClient();
  const [notifications, setNotifications] = useState(init);
  const [filter, setFilter] = useState<'all'|'unread'>('all');

  useEffect(()=>{
    const ch=sb.channel('notifs-page').on('postgres_changes',{event:'INSERT',schema:'public',table:'notifications',filter:`user_id=eq.${userId}`},payload=>{
      setNotifications(p=>[payload.new as any,...p]);
      toast.info(isRTL?(payload.new as any).title_ar:(payload.new as any).title_en);
    }).subscribe();
    return ()=>{ sb.removeChannel(ch); };
  },[userId,isRTL]);

  const markRead=async(id:string)=>{
    await sb.from('notifications').update({is_read:true,read_at:new Date().toISOString()}).eq('id',id);
    setNotifications(p=>p.map(n=>n.id===id?{...n,is_read:true}:n));
  };
  const markAllRead=async()=>{
    await sb.from('notifications').update({is_read:true,read_at:new Date().toISOString()}).eq('user_id',userId).eq('is_read',false);
    setNotifications(p=>p.map(n=>({...n,is_read:true})));
    toast.success('تم تحديد الكل كمقروء');
  };

  const unread=notifications.filter(n=>!n.is_read).length;
  const shown=filter==='unread'?notifications.filter(n=>!n.is_read):notifications;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <PageHeader title="الإشعارات" description={unread>0?`${unread} غير مقروء`:'جميعها مقروءة'}
        actions={unread>0?(<button onClick={markAllRead} className="btn-secondary text-sm py-1.5"><CheckCheck className="w-4 h-4"/>تحديد الكل كمقروء</button>):undefined}/>
      <div className="flex gap-2">
        {[{k:'all' as const,label:`الكل (${notifications.length})`},{k:'unread' as const,label:`غير مقروء (${unread})`}].map(t=>(
          <button key={t.k} onClick={()=>setFilter(t.k)} className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',filter===t.k?'bg-primary-500 text-white border-primary-500':'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>{t.label}</button>
        ))}
      </div>
      {shown.length===0?<EmptyState icon={Bell} title="لا توجد إشعارات" description="ستظهر الإشعارات هنا"/>:(
        <div className="space-y-2">
          {shown.map(n=>(
            <div key={n.id} onClick={()=>!n.is_read&&markRead(n.id)} className={cn('card p-4 flex items-start gap-3 cursor-pointer hover:shadow-elevated transition-all',!n.is_read&&'border-primary-200 bg-primary-50/40')}>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0',!n.is_read?'bg-primary-100':'bg-gray-100')}>{TYPE_ICON[n.type]??'🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm',!n.is_read?'font-semibold text-gray-900':'font-medium text-gray-700')}>{isRTL?n.title_ar:n.title_en}</p>
                  <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">{fRelative(n.created_at,isRTL?'ar':'en')}</span>
                </div>
                {(isRTL?n.body_ar:n.body_en)&&<p className="text-xs text-gray-500 mt-0.5">{isRTL?n.body_ar:n.body_en}</p>}
                {n.link&&<Link href={n.link} onClick={e=>e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-primary-500 hover:underline mt-1">عرض التفاصيل <ExternalLink className="w-3 h-3"/></Link>}
              </div>
              {!n.is_read&&<div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5"/>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
