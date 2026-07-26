'use client';
import { useState, useRef } from 'react';
import { Upload, Download, CheckCircle2, XCircle, AlertTriangle, Loader2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';

const TEMPLATE_HEADERS = ['email','full_name','full_name_ar','phone','national_id','gender','date_of_birth','student_number','level','admission_type'];
const SAMPLE_ROWS = [
  ['ahmed@kcst.edu.sd','Ahmed Mohamed','أحمد محمد','0912345678','12345678','male','2000-01-15','','1','regular'],
  ['fatima@kcst.edu.sd','Fatima Ali','فاطمة علي','0923456789','23456789','female','2001-03-20','','1','regular'],
];

export function ImportClient({ programs }: { programs: any[] }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [programId, setProgramId]     = useState('');
  const [admissionDate, setAdmission] = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows]               = useState<any[]>([]);
  const [fileName, setFileName]       = useState('');
  const [importing, setImporting]     = useState(false);
  const [result, setResult]           = useState<any>(null);

  const downloadTemplate = () => {
    const csv = Papa.unparse({ fields: TEMPLATE_HEADERS, data: SAMPLE_ROWS });
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url;
    a.download = 'kcst_students_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setFileName(file.name); setResult(null);
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: res => {
        setRows(res.data as any[]);
        toast.success(`تم تحميل ${res.data.length} صف`);
      },
      error: err => toast.error(`خطأ في القراءة: ${err.message}`),
    });
  };

  const doImport = async () => {
    if (!programId) { toast.error('اختر البرنامج الأكاديمي'); return; }
    if (!rows.length){ toast.error('لا توجد بيانات للاستيراد'); return; }
    setImporting(true); setResult(null);
    try {
      const res = await fetch('/api/import/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows, programId, admissionDate }),
      });
      const data = await res.json();
      setResult(data);
      if (data.success > 0) toast.success(data.message);
      else toast.error(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally { setImporting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="استيراد الطلاب بالجملة"
        description="رفع ملف CSV لاستيراد عدد كبير من الطلاب دفعة واحدة"
        breadcrumbs={[{ label:'الإدارة' }, { label:'استيراد البيانات' }]}
      />

      {/* Template download */}
      <div className="card p-5 flex items-center gap-4 bg-blue-50 border-blue-200">
        <FileText className="w-8 h-8 text-blue-500 shrink-0"/>
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-800">نموذج ملف الاستيراد</p>
          <p className="text-xs text-blue-600 mt-0.5">حمّل النموذج، أضف بيانات الطلاب، ثم ارفعه.</p>
        </div>
        <button onClick={downloadTemplate} className="btn-secondary text-sm shrink-0">
          <Download className="w-4 h-4"/> تحميل النموذج
        </button>
      </div>

      {/* Settings */}
      <div className="card p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-800">إعدادات الاستيراد</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">البرنامج الأكاديمي *</label>
            <select value={programId} onChange={e => setProgramId(e.target.value)} className="input">
              <option value="">اختر برنامجاً...</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.code} — {p.name_ar}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">تاريخ القبول</label>
            <input type="date" value={admissionDate} onChange={e => setAdmission(e.target.value)} className="input"/>
          </div>
        </div>
      </div>

      {/* File upload */}
      <div className="card p-5">
        <h3 className="text-sm font-bold text-gray-800 mb-4">رفع الملف</h3>
        <div
          onClick={() => fileRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all',
            rows.length > 0
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 hover:border-primary-400 hover:bg-primary-50/30'
          )}
        >
          {rows.length > 0 ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="w-10 h-10 text-green-500"/>
              <p className="text-sm font-bold text-green-700">{fileName}</p>
              <p className="text-xs text-green-600">{rows.length} طالب جاهز للاستيراد</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-gray-300"/>
              <p className="text-sm text-gray-600 font-medium">انقر لاختيار ملف CSV</p>
              <p className="text-xs text-gray-400">يدعم CSV بترميز UTF-8</p>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".csv" onChange={onFile} className="hidden"/>
      </div>

      {/* Preview */}
      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">معاينة البيانات ({rows.length} صف)</h3>
            <p className="text-xs text-gray-400">أول 5 صفوف</p>
          </div>
          <div className="overflow-x-auto">
            <table className="table-base text-xs">
              <thead>
                <tr>
                  {TEMPLATE_HEADERS.map(h => <th key={h} className="text-[10px]">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {TEMPLATE_HEADERS.map(h => <td key={h} className="text-xs">{row[h] ?? '—'}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className={cn('card p-5', result.success > 0 ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30')}>
          <div className="flex items-center gap-3 mb-3">
            {result.success > 0
              ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0"/>
              : <XCircle className="w-5 h-5 text-red-500 shrink-0"/>
            }
            <p className="text-sm font-bold text-gray-800">{result.message}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-center">
              <p className="text-2xl font-bold text-green-600">{result.success}</p>
              <p className="text-xs text-gray-500">تم الاستيراد</p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-center">
              <p className="text-2xl font-bold text-red-500">{result.failed}</p>
              <p className="text-xs text-gray-500">فشل</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {result.errors.map((err: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5"/>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import button */}
      <button
        onClick={doImport}
        disabled={importing || !rows.length || !programId}
        className="btn-primary w-full py-3 text-base"
      >
        {importing ? (
          <><Loader2 className="w-5 h-5 animate-spin"/> جاري الاستيراد...</>
        ) : (
          <><Upload className="w-5 h-5"/> استيراد {rows.length > 0 ? `${rows.length} طالب` : 'الطلاب'}</>
        )}
      </button>
    </div>
  );
}
