'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, BookOpen, DollarSign, AlertTriangle,
  Award, ChevronLeft, GraduationCap, Phone,
  Mail, Calendar, Hash, TrendingUp,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, GPABadge, StatusBadge } from '@/components/shared';
import { fDate, fCurrency, gradeColor, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'info' | 'grades' | 'finance' | 'behavior' | 'certificates';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'info',         label: 'البيانات الأساسية', icon: User },
  { key: 'grades',       label: 'الدرجات',            icon: BookOpen },
  { key: 'finance',      label: 'المالية',             icon: DollarSign },
  { key: 'behavior',     label: 'السلوك',              icon: AlertTriangle },
  { key: 'certificates', label: 'الشهادات',            icon: Award },
];

const STATUS_AR: Record<string, string> = {
  active:'نشط', suspended:'موقوف', graduated:'متخرج', withdrawn:'منسحب', on_leave:'في إجازة',
};
const INV_STATUS_AR: Record<string, string> = {
  pending:'معلق', partial:'جزئي', paid:'مدفوع', overdue:'متأخر', cancelled:'ملغي', waived:'معفو',
};
const INV_BADGE: Record<string, string> = {
  pending:'badge-yellow', partial:'badge-yellow', paid:'badge-green',
  overdue:'badge-red', cancelled:'badge-gray', waived:'badge-gray',
};
const BEH_TYPE_AR: Record<string, string> = {
  violation:'مخالفة', warning:'إنذار', commendation:'تميز', suspension:'إيقاف',
};
const BEH_BADGE: Record<string, string> = {
  violation:'badge-red', warning:'badge-yellow', commendation:'badge-green', suspension:'badge-red',
};

const statusSchema = z.object({
  status: z.enum(['active','suspended','graduated','withdrawn','on_leave']),
  notes:  z.string().optional(),
});

interface Props {
  student:      any;
  enrollments:  any[];
  invoices:     any[];
  behaviors:    any[];
  certificates: any[];
  adminId:      string;
}

export function StudentProfileClient({ student, enrollments, invoices, behaviors, certificates, adminId }: Props) {
  const { i18n } = useTranslation();
  const isRTL    = i18n.language === 'ar';
  const router   = useRouter();
  const sb       = createClient();
  const [tab, setTab] = useState<Tab>('info');
  const [saving, setSaving] = useState(false);

  const profile  = student.profile;
  const program  = student.program;
  const dept     = program?.department;
  const faculty  = dept?.faculty;
  const name     = isRTL ? (profile?.full_name_ar ?? profile?.full_name) : profile?.full_name;

  const { register, handleSubmit } = useForm({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: student.status, notes: student.notes ?? '' },
  });

  const onStatusSave = async (data: any) => {
    setSaving(true);
    const { error } = await sb.from('students').update({
      status: data.status,
      notes:  data.notes || null,
    }).eq('id', student.id);
    setSaving(false);
    if (error) { toast.error('فشل التحديث'); return; }
    toast.success('تم تحديث حالة الطالب');
    router.refresh();
  };

  const renderTab = () => {
    switch (tab) {
      // ── INFO ─────────────────────────────────
      case 'info': return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Personal info */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">البيانات الشخصية</h3>
            {[
              { icon: User,     label: 'الاسم الكامل',    val: name },
              { icon: Mail,     label: 'البريد الإلكتروني', val: profile?.email },
              { icon: Phone,    label: 'الهاتف',           val: profile?.phone ?? '—' },
              { icon: Hash,     label: 'رقم الهوية',       val: profile?.national_id ?? '—' },
              { icon: Calendar, label: 'تاريخ الميلاد',   val: profile?.date_of_birth ? fDate(profile.date_of_birth, isRTL ? 'ar' : 'en') : '—' },
            ].map(({ icon: Icon, label, val }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-gray-400">{label}</p>
                  <p className="text-sm text-gray-800">{val}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Academic info */}
          <div className="card p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">البيانات الأكاديمية</h3>
            {[
              { label: 'رقم الطالب',     val: student.student_number },
              { label: 'البرنامج',        val: isRTL ? program?.name_ar : program?.name_en },
              { label: 'القسم',           val: isRTL ? dept?.name_ar : dept?.name_en },
              { label: 'الكلية',          val: isRTL ? faculty?.name_ar : faculty?.name_en },
              { label: 'المستوى الحالي', val: `المستوى ${student.current_level}` },
              { label: 'تاريخ القبول',   val: fDate(student.admission_date, isRTL ? 'ar' : 'en') },
              { label: 'نوع القبول',     val: student.admission_type === 'regular' ? 'انتظام' : student.admission_type === 'transfer' ? 'تحويل' : 'استثنائي' },
            ].map(({ label, val }) => (
              <div key={label} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs font-semibold text-gray-800">{val}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-1.5">
              <span className="text-xs text-gray-500">المعدل التراكمي</span>
              <GPABadge gpa={student.gpa ?? 0} />
            </div>
          </div>

          {/* Status edit */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-800 mb-4">تحديث الحالة</h3>
            <form onSubmit={handleSubmit(onStatusSave)} className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[150px]">
                <label className="label">الحالة</label>
                <select {...register('status')} className="input">
                  {Object.entries(STATUS_AR).map(([v,l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="label">ملاحظات</label>
                <input {...register('notes')} placeholder="ملاحظة اختيارية..." className="input" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary py-2.5">
                حفظ التغييرات
              </button>
            </form>
          </div>
        </div>
      );

      // ── GRADES ───────────────────────────────
      case 'grades': return (
        <div className="card overflow-hidden">
          <table className="table-base">
            <thead>
              <tr>
                <th>المقرر</th>
                <th>الفصل</th>
                <th className="text-center">المجموع</th>
                <th className="text-center">التقدير</th>
                <th className="text-center">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">لا توجد تسجيلات</td></tr>
              )}
              {enrollments.map(enr => {
                const course = enr.section?.course;
                const grade  = enr.grade?.[0];
                return (
                  <tr key={enr.id}>
                    <td>
                      <p className="text-sm font-medium text-gray-800">{isRTL ? course?.name_ar : course?.name_en}</p>
                      <p className="text-xs text-gray-400 font-mono">{course?.code} • {course?.credits} ساعة</p>
                    </td>
                    <td className="text-xs text-gray-500">
                      {isRTL ? enr.section?.semester?.name_ar : enr.section?.semester?.name_en}
                    </td>
                    <td className="text-center">
                      {grade?.is_published
                        ? <span className={cn('text-sm font-bold', gradeColor(grade.letter))}>{grade.total?.toFixed(1)}</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="text-center">
                      {grade?.is_published
                        ? <span className={cn('text-sm font-bold', gradeColor(grade.letter))}>{grade.letter}</span>
                        : <span className="text-gray-300 text-xs">—</span>
                      }
                    </td>
                    <td className="text-center">
                      <span className={cn('badge text-xs', enr.status === 'enrolled' ? 'badge-green' : 'badge-gray')}>
                        {enr.status === 'enrolled' ? 'مسجّل' : enr.status === 'completed' ? 'مكتمل' : enr.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );

      // ── FINANCE ──────────────────────────────
      case 'finance': return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[
              { l:'الإجمالي',  v: invoices.reduce((s,i)=>s+(i.total_amount??0),0), c:'text-gray-700' },
              { l:'المدفوع',   v: invoices.reduce((s,i)=>s+(i.paid_amount??0),0),  c:'text-green-600' },
              { l:'المتبقي',   v: invoices.reduce((s,i)=>s+(i.balance??0),0),      c:'text-red-500' },
            ].map(item => (
              <div key={item.l} className="card p-4 text-center">
                <p className={cn('text-lg font-bold', item.c)}>{fCurrency(item.v)}</p>
                <p className="text-xs text-gray-400">{item.l}</p>
              </div>
            ))}
          </div>
          <div className="card overflow-hidden">
            <table className="table-base">
              <thead><tr><th>رقم الفاتورة</th><th>الإجمالي</th><th>المدفوع</th><th>الرصيد</th><th>الحالة</th></tr></thead>
              <tbody>
                {invoices.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">لا توجد فواتير</td></tr>}
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs text-primary-600">{inv.invoice_no}</td>
                    <td className="text-sm font-semibold">{fCurrency(inv.total_amount)}</td>
                    <td className="text-sm text-green-600">{fCurrency(inv.paid_amount)}</td>
                    <td className={cn('text-sm font-bold', inv.balance>0?'text-red-500':'text-green-600')}>{fCurrency(inv.balance)}</td>
                    <td><span className={cn('badge text-xs', INV_BADGE[inv.status])}>{INV_STATUS_AR[inv.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );

      // ── BEHAVIOR ─────────────────────────────
      case 'behavior': return (
        <div className="space-y-3">
          {behaviors.length === 0 && (
            <div className="card p-10 text-center">
              <AlertTriangle className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">لا توجد سجلات سلوكية</p>
            </div>
          )}
          {behaviors.map(b => (
            <div key={b.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('badge text-xs', BEH_BADGE[b.type])}>{BEH_TYPE_AR[b.type]}</span>
                    {b.severity && <span className="badge-gray badge text-xs">{b.severity}</span>}
                  </div>
                  <p className="text-sm font-bold text-gray-800">{b.title}</p>
                </div>
                <span className="text-xs text-gray-400">{fDate(b.incident_date, isRTL ? 'ar' : 'en')}</span>
              </div>
              {b.description && <p className="text-xs text-gray-600 mt-1">{b.description}</p>}
              {b.action_taken && (
                <p className="text-xs text-blue-600 mt-1">الإجراء: {b.action_taken}</p>
              )}
            </div>
          ))}
        </div>
      );

      // ── CERTIFICATES ─────────────────────────
      case 'certificates': return (
        <div className="space-y-3">
          {certificates.length === 0 && (
            <div className="card p-10 text-center">
              <Award className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">لا توجد شهادات مُصدَرة</p>
            </div>
          )}
          {certificates.map(cert => (
            <div key={cert.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-accent-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800">{cert.type}</p>
                <p className="text-xs text-gray-400 font-mono">{cert.serial_number} • {fDate(cert.issued_date, isRTL ? 'ar' : 'en')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('badge text-xs', cert.status === 'active' ? 'badge-green' : 'badge-red')}>
                  {cert.status === 'active' ? 'ساري' : cert.status === 'revoked' ? 'ملغي' : 'منتهي'}
                </span>
                {cert.file_url && (
                  <a href={cert.file_url} target="_blank" rel="noopener noreferrer"
                    className="btn-ghost p-1.5 text-xs text-primary-500">تحميل</a>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header card */}
      <div className="card p-5 flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-2xl font-bold shrink-0">
          {(name ?? 'U')[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-lg font-bold text-gray-900">{name}</h1>
              <p className="text-sm text-gray-500 font-mono">{student.student_number}</p>
            </div>
            <div className="flex items-center gap-2">
              <GPABadge gpa={student.gpa ?? 0} />
              <span className={cn('badge text-sm', student.status === 'active' ? 'badge-green' : student.status === 'suspended' ? 'badge-red' : 'badge-gray')}>
                {STATUS_AR[student.status]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" />{isRTL ? program?.name_ar : program?.name_en}</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{student.total_credits} ساعة</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" />المستوى {student.current_level}</span>
          </div>
        </div>
        <Link href="/academic/students" className="btn-ghost p-2 shrink-0">
          <ChevronLeft className={cn('w-4 h-4', isRTL && 'rotate-180')} />
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors shrink-0',
              tab === t.key ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
            )}>
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">{renderTab()}</div>
    </div>
  );
}
