'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactTable,getCoreRowModel,getFilteredRowModel,getPaginationRowModel,getSortedRowModel,flexRender,type ColumnDef } from '@tanstack/react-table';
import { ShieldPlus, UserX, UserCheck, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, ConfirmModal } from '@/components/shared';
import { fDate, getInitials, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/types';

const ALL_ROLES: { value:UserRole; label:string }[]=[
  {value:'platform_admin',label:'مدير المنصة'},{value:'university_admin',label:'مدير الجامعة'},{value:'dean',label:'عميد'},
  {value:'department_head',label:'رئيس قسم'},{value:'professor',label:'أستاذ'},{value:'teaching_assistant',label:'مساعد تدريس'},
  {value:'registrar',label:'مسجّل'},{value:'finance_officer',label:'موظف مالية'},{value:'student',label:'طالب'},
];
const ROLE_COLOR:Record<string,string>={platform_admin:'badge-blue',university_admin:'badge-blue',dean:'badge-accent',department_head:'badge-accent',professor:'badge-blue',teaching_assistant:'badge-blue',registrar:'badge-green',finance_officer:'badge-yellow',student:'badge-gray'};

export function UsersClient({ users, adminId }: { users:any[]; adminId:string }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [globalFilter,setGlobalFilter]=useState('');
  const [roleModal,setRoleModal]=useState<any>(null);
  const [selRoles,setSelRoles]=useState<UserRole[]>([]);
  const [suspendTarget,setSuspend]=useState<any>(null);
  const [saving,setSaving]=useState(false);

  const saveRoles=async()=>{ if(!roleModal) return; setSaving(true);
    await sb.from('user_roles').delete().eq('user_id',roleModal.id);
    if(selRoles.length>0) await sb.from('user_roles').insert(selRoles.map(role=>({user_id:roleModal.id,role,granted_by:adminId})));
    setSaving(false); toast.success('تم تحديث الأدوار'); setRoleModal(null); router.refresh(); };

  const toggleActive=async()=>{ if(!suspendTarget) return; setSaving(true);
    await sb.from('profiles').update({is_active:!suspendTarget.is_active}).eq('id',suspendTarget.id);
    setSaving(false); toast.success(suspendTarget.is_active?'تم إيقاف المستخدم':'تم تفعيل المستخدم'); setSuspend(null); router.refresh(); };

  const columns:ColumnDef<any>[]=[
    {id:'user',header:'المستخدم',accessorFn:r=>r.full_name,cell:({row:{original:u}})=>(
      <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">{getInitials(u.full_name||'U')}</div>
      <div><p className="text-sm font-medium text-gray-800">{isRTL?(u.full_name_ar??u.full_name):u.full_name}</p><p className="text-xs text-gray-400">{u.email}</p></div></div>)},
    {id:'roles',header:'الأدوار',cell:({row:{original:u}})=>(
      <div className="flex items-center gap-1 flex-wrap">
        {(u.roles??[]).length===0?<span className="text-xs text-gray-300">بدون دور</span>:(u.roles as string[]).slice(0,2).map((r:string)=>(<span key={r} className={cn('badge text-[10px]',ROLE_COLOR[r]??'badge-gray')}>{ALL_ROLES.find(x=>x.value===r)?.label??r}</span>))}
        {(u.roles??[]).length>2&&<span className="text-[10px] text-gray-400">+{u.roles.length-2}</span>}
      </div>)},
    {accessorKey:'is_active',header:'الحالة',cell:({row:{original:u}})=><span className={cn('badge text-xs',u.is_active?'badge-green':'badge-red')}>{u.is_active?'نشط':'موقوف'}</span>},
    {accessorKey:'created_at',header:'تاريخ التسجيل',cell:({getValue})=><span className="text-xs text-gray-400">{fDate(getValue() as string,isRTL?'ar':'en')}</span>},
    {id:'actions',header:'',cell:({row:{original:u}})=>(
      <div className="flex items-center gap-1 justify-end">
        <button onClick={()=>{setSelRoles(u.roles??[]);setRoleModal(u);}} className="btn-ghost p-1.5" title="أدوار"><ShieldPlus className="w-3.5 h-3.5"/></button>
        {u.id!==adminId&&<button onClick={()=>setSuspend(u)} className={cn('btn-ghost p-1.5',u.is_active?'hover:text-red-500':'hover:text-green-600')}>{u.is_active?<UserX className="w-3.5 h-3.5"/>:<UserCheck className="w-3.5 h-3.5"/>}</button>}
      </div>)},
  ];
  const table=useReactTable({data:users,columns,state:{globalFilter},onGlobalFilterChange:setGlobalFilter,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel(),getSortedRowModel:getSortedRowModel(),getPaginationRowModel:getPaginationRowModel(),initialState:{pagination:{pageSize:20}}});

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="المستخدمون" description={`${users.length} مستخدم مسجّل`} breadcrumbs={[{label:'الإدارة'},{label:'المستخدمون'}]}/>
      <div className="grid grid-cols-4 gap-3">
        {[{label:'الكل',n:users.length,c:'text-gray-700'},{label:'نشط',n:users.filter(u=>u.is_active).length,c:'text-green-600'},{label:'بدون دور',n:users.filter(u=>!u.roles?.length).length,c:'text-amber-600'},{label:'موقوف',n:users.filter(u=>!u.is_active).length,c:'text-red-500'}].map(s=>(
          <div key={s.label} className="card p-3 text-center"><p className={cn('text-xl font-bold',s.c)}>{s.n}</p><p className="text-xs text-gray-400">{s.label}</p></div>
        ))}
      </div>
      <div className="relative w-64"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/><input value={globalFilter} onChange={e=>setGlobalFilter(e.target.value)} placeholder="بحث بالاسم أو البريد..." className="input ps-9 text-sm"/></div>
      <div className="table-wrapper"><div className="overflow-x-auto"><table className="table-base">
        <thead>{table.getHeaderGroups().map(hg=>(<tr key={hg.id}>{hg.headers.map(h=>(<th key={h.id} onClick={h.column.getToggleSortingHandler()} className={cn(h.column.getCanSort()&&'cursor-pointer select-none')}><div className="flex items-center gap-1">{flexRender(h.column.columnDef.header,h.getContext())}{h.column.getCanSort()&&<ChevronsUpDown className="w-3 h-3 text-gray-300"/>}</div></th>))}</tr>))}</thead>
        <tbody>{table.getRowModel().rows.map(row=>(<tr key={row.id}>{row.getVisibleCells().map(cell=>(<td key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>))}</tr>))}
          {table.getRowModel().rows.length===0&&<tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">لا نتائج</td></tr>}
        </tbody>
      </table></div>
      {table.getPageCount()>1&&(<div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <span>صفحة {table.getState().pagination.pageIndex+1} من {table.getPageCount()}</span>
        <div className="flex gap-1">
          <button onClick={()=>table.previousPage()} disabled={!table.getCanPreviousPage()} className="btn-ghost p-1.5 disabled:opacity-40">{isRTL?<ChevronRight className="w-4 h-4"/>:<ChevronLeft className="w-4 h-4"/>}</button>
          <button onClick={()=>table.nextPage()} disabled={!table.getCanNextPage()} className="btn-ghost p-1.5 disabled:opacity-40">{isRTL?<ChevronLeft className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}</button>
        </div>
      </div>)}
      </div>
      {roleModal&&(
        <div className="modal-backdrop"><div className="modal-box p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">أدوار المستخدم</h2>
          <p className="text-sm text-gray-500 mb-5">{isRTL?roleModal.full_name_ar??roleModal.full_name:roleModal.full_name}</p>
          <div className="space-y-2 mb-5">{ALL_ROLES.map(r=>(<label key={r.value} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={selRoles.includes(r.value)} onChange={()=>setSelRoles(p=>p.includes(r.value)?p.filter(x=>x!==r.value):[...p,r.value])} className="accent-primary-500 w-4 h-4"/>
            <span className="text-sm text-gray-700">{r.label}</span>
          </label>))}</div>
          <div className="flex gap-3"><button onClick={()=>setRoleModal(null)} className="btn-secondary flex-1">إلغاء</button><button onClick={saveRoles} disabled={saving} className="btn-primary flex-1">حفظ الأدوار</button></div>
        </div></div>
      )}
      <ConfirmModal open={!!suspendTarget} title={suspendTarget?.is_active?'إيقاف المستخدم':'تفعيل المستخدم'}
        desc={suspendTarget?.is_active?`سيُمنع ${suspendTarget?.full_name} من تسجيل الدخول.`:`سيتمكن ${suspendTarget?.full_name} من تسجيل الدخول مجدداً.`}
        confirmLabel={suspendTarget?.is_active?'إيقاف':'تفعيل'} danger={!!suspendTarget?.is_active}
        onConfirm={toggleActive} onCancel={()=>setSuspend(null)} loading={saving}/>
    </div>
  );
}
