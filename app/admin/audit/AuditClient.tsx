'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollText, Search, ChevronDown, ChevronRight, User } from 'lucide-react';
import { PageHeader, EmptyState } from '@/components/shared';
import { fDateTime, cn } from '@/lib/utils';

const ACTION_META: Record<string,{label:string;color:string;icon:string}> = {
  INSERT:{label:'إنشاء', color:'badge-green', icon:'➕'},
  UPDATE:{label:'تعديل', color:'badge-blue',  icon:'✏️'},
  DELETE:{label:'حذف',   color:'badge-red',   icon:'🗑️'},
  LOGIN: {label:'دخول',  color:'badge-gray',  icon:'🔐'},
  LOGOUT:{label:'خروج',  color:'badge-gray',  icon:'👋'},
};

export function AuditClient({ logs }: { logs: any[] }) {
  const { i18n } = useTranslation(); const isRTL = i18n.language === 'ar';
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<string|null>(null);
  const [actionFilter, setAct]  = useState('all');

  const filtered = logs.filter(l => {
    const ms = !search || l.table_name?.toLowerCase().includes(search.toLowerCase()) || l.actor?.full_name?.toLowerCase().includes(search.toLowerCase());
    const ma = actionFilter === 'all' || l.action === actionFilter;
    return ms && ma;
  });

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader title="سجل التدقيق" description={`${logs.length} عملية`} breadcrumbs={[{label:'الإدارة'},{label:'التدقيق'}]}/>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="input ps-9 text-sm"/></div>
        <select value={actionFilter} onChange={e=>setAct(e.target.value)} className="input w-32 text-sm">
          <option value="all">الكل</option>
          {Object.entries(ACTION_META).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {filtered.length===0?<EmptyState icon={ScrollText} title="لا توجد سجلات"/>:(
        <div className="space-y-1.5">
          {filtered.map(log=>{
            const meta=ACTION_META[log.action]??{label:log.action,color:'badge-gray',icon:'📋'};
            const isOpen=expanded===log.id; const hasDiff=log.old_data||log.new_data;
            const actorName=isRTL?log.actor?.full_name_ar??log.actor?.full_name:log.actor?.full_name;
            return(
              <div key={log.id} className={cn('card overflow-hidden',isOpen&&'shadow-elevated')}>
                <button onClick={()=>hasDiff&&setExpanded(isOpen?null:log.id)}
                  className={cn('w-full flex items-center gap-3 p-3.5 text-start',hasDiff?'hover:bg-surface-raised cursor-pointer':'cursor-default')}>
                  <span className="text-base shrink-0">{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('badge text-[10px]',meta.color)}>{meta.label}</span>
                      <span className="text-xs font-mono font-semibold text-text-primary">{log.table_name}</span>
                      {log.record_id&&<span className="text-[10px] font-mono text-text-muted hidden sm:inline">#{log.record_id.slice(0,8)}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-text-muted">
                      {log.actor&&<span className="flex items-center gap-1"><User className="w-3 h-3"/>{actorName??log.actor?.email}</span>}
                      <span>{fDateTime(log.created_at,isRTL?'ar':'en')}</span>
                    </div>
                  </div>
                  {hasDiff&&(isOpen?<ChevronDown className="w-4 h-4 text-text-muted shrink-0"/>:<ChevronRight className="w-4 h-4 text-text-muted shrink-0"/>)}
                </button>
                {isOpen&&hasDiff&&(
                  <div className="border-t border-border-subtle p-4 bg-surface-raised animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {log.old_data&&<div><p className="text-xs font-bold text-danger-DEFAULT mb-2">قبل</p><pre className="text-[10px] font-mono bg-danger-50 border border-red-200 rounded-lg p-3 overflow-x-auto max-h-40 whitespace-pre-wrap text-red-800">{JSON.stringify(log.old_data,null,2)}</pre></div>}
                      {log.new_data&&<div><p className="text-xs font-bold text-success-DEFAULT mb-2">بعد</p><pre className="text-[10px] font-mono bg-success-50 border border-green-200 rounded-lg p-3 overflow-x-auto max-h-40 whitespace-pre-wrap text-green-800">{JSON.stringify(log.new_data,null,2)}</pre></div>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
