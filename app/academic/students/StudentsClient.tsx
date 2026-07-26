'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Eye, UserX, UserCheck, ChevronLeft, ChevronRight, ChevronsUpDown, Search, Download } from 'lucide-react';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, GPABadge, ConfirmModal } from '@/components/shared';
import { fDate, getInitials, cn, STUDENT_STATUS } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';

export function StudentsClient({ students, programs, adminId }: { students:any[]; programs:any[]; adminId:string }) {
  const { i18n } = useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [globalFilter,setGlobalFilter]=useState('');
  const [statusFilter,setStatusFilter]=useState('all');
  const [suspendTarget,setSuspend]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const filtered=statusFilter==='all'?students:students.filter(s=>s.status===statusFilter);
  const handleToggleStatus=async()=>{ if(!suspendTarget) return; setSaving(true);
    const newStatus=suspendTarget.status==='suspended'?'active':'suspended';
    await sb.from('students').update({status:newStatus}).eq('id',suspendTarget.id);
    toast.success(newStatus==='suspended'?'تم إيقاف الطالب':'تم تفعيل الطالب');
    setSuspend(null); setSaving(false); router.refresh(); };
  const exportCSV=()=>{
    const data=students.map(s=>({'رقم الطالب':s.student_number,'الاسم':s.profile?.full_name,'البريد':s.profile?.email,'البرنامج':s.program?.name_ar,'المستوى':s.current_level,'المعدل':s.gpa,'الحالة':STUDENT_STATUS[s.status as any]?.ar??s.status,'تاريخ القبول':s.admission_date}));
    const csv=Papa.unparse(data); const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='students.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const columns: ColumnDef<any>[]=[
    {accessorKey:'student_number',header:'الرقم',cell:({getValue})=><span className="text-xs font-mono text-gray-500">{getValue() as string}</span>},
    {id:'student',header:'الطالب',accessorFn:r=>r.profile?.full_name??'',cell:({row:{original:s}})=>(
      <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">{getInitials(s.profile?.full_name??'U')}</div>
      <div><p className="text-sm font-medium text-gray-800">{isRTL?(s.profile?.full_name_ar??s.profile?.full_name):s.profile?.full_name}</p><p className="text-xs text-gray-400">{s.profile?.email}</p></div></div>)},
    {id:'program',header:'البرنامج',accessorFn:r=>r.program?.name_ar??'',cell:({row:{original:s}})=>(<div><p className="text-xs font-medium text-gray-700">{isRTL?s.program?.name_ar:s.program?.name_en}</p></div>)},
    {accessorKey:'current_level',header:'المستوى',cell:({getValue})=><span className="inline-flex w-7 h-7 rounded-full bg-primary-50 text-primary-600 text-xs font-bold items-center justify-center">{getValue() as number}</span>},
    {accessorKey:'gpa',header:'المعدل',cell:({getValue})=><GPABadge gpa={(getValue() as number)??0}/>},
    {accessorKey:'status',header:'الحالة',cell:({getValue})=>{const s=getValue() as string;const cfg=STUDENT_STATUS[s as any];return <span className={cn('badge text-xs',cfg?.badge??'badge-gray')}>{cfg?.ar??s}</span>;}},
    {accessorKey:'admission_date',header:'القبول',cell:({getValue})=><span className="text-xs text-gray-400">{fDate(getValue() as string,isRTL?'ar':'en')}</span>},
    {id:'actions',header:'',cell:({row:{original:s}})=>(<div className="flex items-center gap-1 justify-end" onClick={e=>e.stopPropagation()}>
      <Link href={`/academic/students/${s.id}`} className="btn-ghost p-1.5"><Eye className="w-3.5 h-3.5"/></Link>
      <button onClick={()=>setSuspend(s)} className={cn('btn-ghost p-1.5',s.status==='suspended'?'hover:text-green-600':'hover:text-red-500')}>{s.status==='suspended'?<UserCheck className="w-3.5 h-3.5"/>:<UserX className="w-3.5 h-3.5"/>}</button>
    </div>)},
  ];
  const table=useReactTable({data:filtered,columns,state:{globalFilter},onGlobalFilterChange:setGlobalFilter,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel(),getSortedRowModel:getSortedRowModel(),getPaginationRowModel:getPaginationRowModel(),initialState:{pagination:{pageSize:25}}});
  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="إدارة الطلاب" description={`${students.length} طالب مسجّل`} breadcrumbs={[{label:'الشؤون الأكاديمية'},{label:'الطلاب'}]}
        actions={<div className="flex gap-2"><button onClick={exportCSV} className="btn-secondary text-sm py-1.5"><Download className="w-4 h-4"/>تصدير CSV</button><Link href="/academic/students/new" className="btn-primary text-sm py-1.5"><UserPlus className="w-4 h-4"/>إضافة طالب</Link></div>}/>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[{k:'all',l:'الكل',n:students.length,c:'text-gray-700'},{k:'active',l:'نشط',n:students.filter(s=>s.status==='active').length,c:'text-green-600'},{k:'suspended',l:'موقوف',n:students.filter(s=>s.status==='suspended').length,c:'text-red-500'},{k:'graduated',l:'متخرج',n:students.filter(s=>s.status==='graduated').length,c:'text-blue-600'},{k:'on_leave',l:'في إجازة',n:students.filter(s=>s.status==='on_leave').length,c:'text-amber-600'}].map(s=>(
          <button key={s.k} onClick={()=>setStatusFilter(s.k)} className={cn('card p-3 text-center transition-all',statusFilter===s.k&&'ring-2 ring-primary-400')}>
            <p className={cn('text-xl font-bold',s.c)}>{s.n}</p><p className="text-xs text-gray-400">{s.l}</p>
          </button>
        ))}
      </div>
      <div className="relative w-72"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/><input value={globalFilter} onChange={e=>setGlobalFilter(e.target.value)} placeholder="بحث بالاسم أو الرقم أو البريد..." className="input ps-9 text-sm"/></div>
      <div className="table-wrapper"><div className="overflow-x-auto"><table className="table-base">
        <thead>{table.getHeaderGroups().map(hg=>(<tr key={hg.id}>{hg.headers.map(h=>(<th key={h.id} onClick={h.column.getToggleSortingHandler()} className={cn(h.column.getCanSort()&&'cursor-pointer select-none')}><div className="flex items-center gap-1">{flexRender(h.column.columnDef.header,h.getContext())}{h.column.getCanSort()&&<ChevronsUpDown className="w-3 h-3 text-gray-300"/>}</div></th>))}</tr>))}</thead>
        <tbody>{table.getRowModel().rows.map(row=>(<tr key={row.id} className="cursor-pointer" onClick={()=>router.push(`/academic/students/${row.original.id}`)}>{row.getVisibleCells().map(cell=>(<td key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>))}</tr>))}
          {table.getRowModel().rows.length===0&&<tr><td colSpan={columns.length} className="text-center py-10 text-gray-400 text-sm">لا توجد نتائج</td></tr>}
        </tbody>
      </table></div>
      {table.getPageCount()>1&&(<div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <span>{table.getFilteredRowModel().rows.length} نتيجة • صفحة {table.getState().pagination.pageIndex+1} من {table.getPageCount()}</span>
        <div className="flex gap-1">
          <button onClick={()=>table.previousPage()} disabled={!table.getCanPreviousPage()} className="btn-ghost p-1.5 disabled:opacity-40">{isRTL?<ChevronRight className="w-4 h-4"/>:<ChevronLeft className="w-4 h-4"/>}</button>
          <button onClick={()=>table.nextPage()} disabled={!table.getCanNextPage()} className="btn-ghost p-1.5 disabled:opacity-40">{isRTL?<ChevronLeft className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}</button>
        </div>
      </div>)}
      </div>
      <ConfirmModal open={!!suspendTarget} title={suspendTarget?.status==='suspended'?'تفعيل الطالب':'إيقاف الطالب'}
        desc={suspendTarget?.status==='suspended'?`سيُعاد تفعيل الطالب ${suspendTarget?.profile?.full_name}.`:`سيتم إيقاف الطالب ${suspendTarget?.profile?.full_name} مؤقتاً.`}
        confirmLabel={suspendTarget?.status==='suspended'?'تفعيل':'إيقاف'} danger={suspendTarget?.status!=='suspended'}
        onConfirm={handleToggleStatus} onCancel={()=>setSuspend(null)} loading={saving}/>
    </div>
  );
}
