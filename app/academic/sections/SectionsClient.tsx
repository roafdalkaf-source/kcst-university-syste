'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, Loader2, Search, Users, X, ChevronLeft, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { useReactTable,getCoreRowModel,getFilteredRowModel,getPaginationRowModel,getSortedRowModel,flexRender,type ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, ConfirmModal } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const schema=z.object({course_id:z.string().uuid('اختر مقرراً'),semester_id:z.string().uuid('اختر فصلاً'),professor_id:z.string().optional(),code:z.string().min(1,'الكود مطلوب').max(10),room:z.string().optional(),capacity:z.number().int().min(5).max(300)});
type F=z.infer<typeof schema>;
const STATUS_BADGE:Record<string,string>={open:'badge-green',closed:'badge-gray',cancelled:'badge-red'};
const STATUS_AR:Record<string,string>={open:'مفتوحة',closed:'مغلقة',cancelled:'ملغية'};

export function SectionsClient({ sections, semesters, courses, professors, adminId }: { sections:any[];semesters:any[];courses:any[];professors:any[];adminId:string }) {
  const { i18n }=useTranslation(); const isRTL=i18n.language==='ar';
  const router=useRouter(); const sb=createClient();
  const [globalFilter,setGlobalFilter]=useState('');
  const [modal,setModal]=useState<{open:boolean;edit?:any}>({open:false});
  const [delTarget,setDel]=useState<any>(null);
  const [saving,setSaving]=useState(false);
  const { register,handleSubmit,reset,formState:{errors} }=useForm<F>({resolver:zodResolver(schema),defaultValues:{capacity:40}});

  const openNew=()=>{reset({capacity:40});setModal({open:true});};
  const openEdit=(s:any)=>{reset({course_id:s.course_id,semester_id:s.semester_id,professor_id:s.professor_id??'',code:s.code,room:s.room??'',capacity:s.capacity});setModal({open:true,edit:s});};

  const onSubmit=async(data:F)=>{ setSaving(true);
    const payload={course_id:data.course_id,semester_id:data.semester_id,professor_id:data.professor_id||null,code:data.code.toUpperCase(),room:data.room||null,capacity:data.capacity};
    const {error}=modal.edit?await sb.from('sections').update(payload).eq('id',modal.edit.id):await sb.from('sections').insert(payload);
    setSaving(false); if(error){toast.error(error.message.includes('unique')?'الشعبة موجودة بالفعل':error.message);return;}
    toast.success(modal.edit?'تم التحديث':'تمت إضافة الشعبة'); setModal({open:false}); router.refresh(); };

  const doDelete=async()=>{ if(!delTarget) return; setSaving(true);
    const {error}=await sb.from('sections').delete().eq('id',delTarget.id);
    setSaving(false); if(error){toast.error('لا يمكن الحذف — توجد تسجيلات مرتبطة');return;}
    toast.success('تم حذف الشعبة'); setDel(null); router.refresh(); };

  const columns:ColumnDef<any>[]=[
    {id:'course',header:'المقرر',accessorFn:r=>r.course?.name_ar??'',cell:({row:{original:s}})=>(<div><p className="text-sm font-semibold text-gray-800">{isRTL?s.course?.name_ar:s.course?.name_en}</p><p className="text-xs text-gray-400 font-mono">{s.course?.code} • الشعبة {s.code}</p></div>)},
    {id:'semester',header:'الفصل',cell:({row:{original:s}})=>(<div className="flex items-center gap-1.5"><span className="text-xs text-gray-600">{isRTL?s.semester?.name_ar:s.semester?.name_en}</span>{s.semester?.is_active&&<span className="badge-green badge text-[10px]">نشط</span>}</div>)},
    {id:'professor',header:'الأستاذ',cell:({row:{original:s}})=>(<span className="text-sm text-gray-600">{s.professor?(isRTL?s.professor.full_name_ar??s.professor.full_name:s.professor.full_name):<span className="text-gray-300">—</span>}</span>)},
    {id:'capacity',header:'الطلاب',cell:({row:{original:s}})=>(<div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400"/><span className="text-sm font-medium text-gray-700">{s.enrolled_count}</span><span className="text-gray-300">/</span><span className="text-xs text-gray-400">{s.capacity}</span><div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary-400 rounded-full" style={{width:`${Math.min(100,(s.enrolled_count/s.capacity)*100)}%`}}/></div></div>)},
    {accessorKey:'status',header:'الحالة',cell:({getValue})=>{const v=getValue() as string;return <span className={cn('badge text-xs',STATUS_BADGE[v])}>{STATUS_AR[v]}</span>;}},
    {accessorKey:'room',header:'القاعة',cell:({getValue})=><span className="text-xs text-gray-500">{(getValue() as string)||'—'}</span>},
    {id:'actions',header:'',cell:({row:{original:s}})=>(<div className="flex items-center gap-1 justify-end" onClick={e=>e.stopPropagation()}>
      <Link href={`/professor/section/${s.id}`} className="btn-ghost p-1.5 text-xs text-primary-500">إدارة</Link>
      <button onClick={()=>openEdit(s)} className="btn-ghost p-1.5"><Edit2 className="w-3.5 h-3.5"/></button>
      <button onClick={()=>setDel(s)} className="btn-ghost p-1.5 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
    </div>)},
  ];
  const table=useReactTable({data:sections,columns,state:{globalFilter},onGlobalFilterChange:setGlobalFilter,getCoreRowModel:getCoreRowModel(),getFilteredRowModel:getFilteredRowModel(),getSortedRowModel:getSortedRowModel(),getPaginationRowModel:getPaginationRowModel(),initialState:{pagination:{pageSize:25}}});

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="إدارة الشعب" description={`${sections.length} شعبة`} breadcrumbs={[{label:'الشؤون الأكاديمية'},{label:'الشعب'}]}
        actions={<button onClick={openNew} className="btn-primary"><Plus className="w-4 h-4"/>شعبة جديدة</button>}/>
      <div className="grid grid-cols-3 gap-3">
        {[{l:'مفتوحة',n:sections.filter(s=>s.status==='open').length,c:'text-green-600'},{l:'مغلقة',n:sections.filter(s=>s.status==='closed').length,c:'text-gray-500'},{l:'ملغية',n:sections.filter(s=>s.status==='cancelled').length,c:'text-red-500'}].map(s=>(
          <div key={s.l} className="card p-4 text-center"><p className={cn('text-2xl font-bold',s.c)}>{s.n}</p><p className="text-xs text-gray-400">{s.l}</p></div>
        ))}
      </div>
      <div className="relative w-72"><Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"/><input value={globalFilter} onChange={e=>setGlobalFilter(e.target.value)} placeholder="بحث بالمقرر أو الأستاذ..." className="input ps-9 text-sm"/></div>
      <div className="table-wrapper"><div className="overflow-x-auto"><table className="table-base">
        <thead>{table.getHeaderGroups().map(hg=>(<tr key={hg.id}>{hg.headers.map(h=>(<th key={h.id} onClick={h.column.getToggleSortingHandler()} className={cn(h.column.getCanSort()&&'cursor-pointer select-none')}><div className="flex items-center gap-1">{flexRender(h.column.columnDef.header,h.getContext())}{h.column.getCanSort()&&<ChevronsUpDown className="w-3 h-3 text-gray-300"/>}</div></th>))}</tr>))}</thead>
        <tbody>{table.getRowModel().rows.map(row=>(<tr key={row.id}>{row.getVisibleCells().map(cell=>(<td key={cell.id}>{flexRender(cell.column.columnDef.cell,cell.getContext())}</td>))}</tr>))}
          {table.getRowModel().rows.length===0&&<tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">لا توجد شعب</td></tr>}
        </tbody>
      </table></div>
      {table.getPageCount()>1&&(<div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
        <span>صفحة {table.getState().pagination.pageIndex+1} من {table.getPageCount()}</span>
        <div className="flex gap-1"><button onClick={()=>table.previousPage()} disabled={!table.getCanPreviousPage()} className="btn-ghost p-1.5 disabled:opacity-40">{isRTL?<ChevronRight className="w-4 h-4"/>:<ChevronLeft className="w-4 h-4"/>}</button><button onClick={()=>table.nextPage()} disabled={!table.getCanNextPage()} className="btn-ghost p-1.5 disabled:opacity-40">{isRTL?<ChevronLeft className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}</button></div>
      </div>)}</div>

      {modal.open&&(
        <div className="modal-backdrop"><div className="modal-box p-6 max-w-lg" onClick={e=>e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5"><h2 className="text-base font-bold text-gray-900">{modal.edit?'تعديل الشعبة':'شعبة جديدة'}</h2><button onClick={()=>setModal({open:false})} className="btn-ghost p-1.5"><X className="w-4 h-4"/></button></div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div><label className="label">المقرر *</label><select {...register('course_id')} className={cn('input',errors.course_id&&'input-error')}><option value="">اختر مقرراً...</option>{courses.map(c=><option key={c.id} value={c.id}>{c.code} — {isRTL?c.name_ar:c.name_en}</option>)}</select>{errors.course_id&&<p className="text-xs text-red-500 mt-1">{errors.course_id.message}</p>}</div>
            <div><label className="label">الفصل الدراسي *</label><select {...register('semester_id')} className={cn('input',errors.semester_id&&'input-error')}><option value="">اختر فصلاً...</option>{semesters.map(s=><option key={s.id} value={s.id}>{isRTL?s.name_ar:s.name_en}{s.is_active?' (نشط)':''}</option>)}</select>{errors.semester_id&&<p className="text-xs text-red-500 mt-1">{errors.semester_id.message}</p>}</div>
            <div><label className="label">الأستاذ <span className="text-gray-400">(اختياري)</span></label><select {...register('professor_id')} className="input"><option value="">بدون أستاذ</option>{professors.map(p=><option key={p.id} value={p.id}>{isRTL?p.full_name_ar??p.full_name:p.full_name}</option>)}</select></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="label">الكود *</label><input {...register('code')} placeholder="A" className={cn('input uppercase',errors.code&&'input-error')}/>{errors.code&&<p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}</div>
              <div><label className="label">القاعة</label><input {...register('room')} placeholder="A101" className="input"/></div>
              <div><label className="label">السعة *</label><input {...register('capacity',{valueAsNumber:true})} type="number" min={5} max={300} className="input"/>{errors.capacity&&<p className="text-xs text-red-500 mt-1">مطلوب</p>}</div>
            </div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={()=>setModal({open:false})} className="btn-secondary flex-1">إلغاء</button><button type="submit" disabled={saving} className="btn-primary flex-1">{saving&&<Loader2 className="w-4 h-4 animate-spin"/>}{modal.edit?'حفظ التعديلات':'إضافة الشعبة'}</button></div>
          </form>
        </div></div>
      )}
      <ConfirmModal open={!!delTarget} title="حذف الشعبة" desc={`سيتم حذف الشعبة "${delTarget?.code}" نهائياً.`} confirmLabel="حذف" onConfirm={doDelete} onCancel={()=>setDel(null)} loading={saving}/>
    </div>
  );
}
