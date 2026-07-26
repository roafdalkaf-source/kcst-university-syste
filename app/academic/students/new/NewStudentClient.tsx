'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, UserPlus, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const schema = z.object({
  full_name:      z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل'),
  full_name_ar:   z.string().optional(),
  email:          z.string().email('بريد إلكتروني غير صالح'),
  phone:          z.string().optional(),
  national_id:    z.string().optional(),
  gender:         z.enum(['male','female']).optional(),
  date_of_birth:  z.string().optional(),
  program_id:     z.string().uuid('اختر برنامجاً'),
  student_number: z.string().min(3, 'رقم الطالب مطلوب'),
  admission_date: z.string().min(1, 'تاريخ القبول مطلوب'),
  admission_type: z.enum(['regular','transfer','exceptional']),
  current_level:  z.number().int().min(1).max(8),
  notes:          z.string().optional(),
});
type F = z.infer<typeof schema>;

const DEGREE_AR: Record<string,string> = { diploma:'دبلوم', bachelor:'بكالوريوس', master:'ماجستير', phd:'دكتوراه' };

interface Props { programs: any[]; suggestedNo: string; adminId: string; }

export function NewStudentClient({ programs, suggestedNo, adminId }: Props) {
  const router = useRouter();
  const sb     = createClient();
  const [step, setStep] = useState<1|2>(1);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, trigger, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      student_number: suggestedNo,
      admission_date: new Date().toISOString().split('T')[0],
      admission_type: 'regular',
      current_level:  1,
    },
  });

  const nextStep = async () => {
    const valid = await trigger(['full_name','email','program_id']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: F) => {
    setSaving(true);
    try {
      // 1. Create auth user + profile via admin (invites user by email)
      // In production: use admin client. Here we insert profile directly.
      // First check if profile with this email exists
      const { data: existingProfile } = await sb
        .from('profiles').select('id').eq('email', data.email).single();

      let profileId: string;

      if (existingProfile) {
        profileId = existingProfile.id;
      } else {
        // Create a placeholder profile (user will complete signup via invite)
        const fakeId = crypto.randomUUID();
        const { error: pErr } = await sb.from('profiles').insert({
          id:           fakeId,
          email:        data.email,
          full_name:    data.full_name,
          full_name_ar: data.full_name_ar || null,
          phone:        data.phone || null,
          national_id:  data.national_id || null,
          gender:       data.gender || null,
          date_of_birth:data.date_of_birth || null,
        });
        // If profile creation fails (auth constraint), show message
        if (pErr) {
          toast.error('يجب أن يسجّل الطالب أولاً عبر /auth/signup ثم يُضاف هنا');
          setSaving(false);
          return;
        }
        profileId = fakeId;
      }

      // 2. Create student record
      const { data: newStudent, error: sErr } = await sb.from('students').insert({
        profile_id:     profileId,
        program_id:     data.program_id,
        student_number: data.student_number,
        admission_date: data.admission_date,
        admission_type: data.admission_type,
        current_level:  data.current_level,
        status:         'active',
        notes:          data.notes || null,
      }).select('id').single();

      if (sErr) {
        if (sErr.message.includes('unique')) {
          toast.error('رقم الطالب أو البريد الإلكتروني مستخدم مسبقاً');
        } else {
          toast.error(sErr.message);
        }
        setSaving(false);
        return;
      }

      // 3. Grant student role
      await sb.from('user_roles').insert({
        user_id:    profileId,
        role:       'student',
        granted_by: adminId,
      });

      toast.success(`تمت إضافة الطالب ${data.full_name} بنجاح`);
      router.push(`/academic/students/${newStudent?.id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'حدث خطأ');
      setSaving(false);
    }
  };

  const Field = ({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) => (
    <div>
      <label className="label">{label}{required && <span className="text-red-400 ms-0.5">*</span>}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="إضافة طالب جديد"
        breadcrumbs={[{ label:'الشؤون الأكاديمية' }, { label:'الطلاب', href:'/academic/students' }, { label:'جديد' }]}
        actions={
          <Link href="/academic/students" className="btn-secondary text-sm">
            <ChevronLeft className="w-4 h-4" /> رجوع
          </Link>
        }
      />

      {/* Steps */}
      <div className="flex items-center gap-3">
        {[{ n:1, l:'البيانات الشخصية' },{ n:2, l:'البيانات الأكاديمية' }].map((s,i) => (
          <div key={s.n} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-gray-200" />}
            <div className={cn('flex items-center gap-2')}>
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                step >= s.n ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400')}>
                {s.n}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block', step >= s.n ? 'text-gray-800' : 'text-gray-400')}>
                {s.l}
              </span>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ── Step 1: Personal ── */}
        {step === 1 && (
          <div className="card p-6 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-800">البيانات الشخصية</h3>
            <div className="grid grid-cols-2 gap-4">
              <Field label="الاسم الكامل (إنجليزي)" required error={errors.full_name?.message}>
                <input {...register('full_name')} placeholder="Ahmed Mohamed" className={cn('input', errors.full_name && 'input-error')} />
              </Field>
              <Field label="الاسم الكامل (عربي)">
                <input {...register('full_name_ar')} placeholder="أحمد محمد" className="input" />
              </Field>
            </div>
            <Field label="البريد الإلكتروني" required error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="student@kcst.edu" className={cn('input', errors.email && 'input-error')} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="رقم الهاتف">
                <input {...register('phone')} placeholder="+249-12-345-6789" className="input" />
              </Field>
              <Field label="رقم الهوية الوطنية">
                <input {...register('national_id')} className="input" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="الجنس">
                <select {...register('gender')} className="input">
                  <option value="">اختر...</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </Field>
              <Field label="تاريخ الميلاد">
                <input {...register('date_of_birth')} type="date" className="input" />
              </Field>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={nextStep} className="btn-primary">
                التالي →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Academic ── */}
        {step === 2 && (
          <div className="card p-6 space-y-4 animate-fade-in">
            <h3 className="text-sm font-bold text-gray-800">البيانات الأكاديمية</h3>
            <Field label="البرنامج الأكاديمي" required error={errors.program_id?.message}>
              <select {...register('program_id')} className={cn('input', errors.program_id && 'input-error')}>
                <option value="">اختر برنامجاً...</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name_ar} ({DEGREE_AR[p.degree_level]})
                  </option>
                ))}
              </select>
              {errors.program_id && <p className="text-xs text-red-500 mt-1">{errors.program_id.message}</p>}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="رقم الطالب" required error={errors.student_number?.message}>
                <input {...register('student_number')} className={cn('input font-mono', errors.student_number && 'input-error')} />
              </Field>
              <Field label="المستوى الحالي" required>
                <select {...register('current_level', { valueAsNumber: true })} className="input">
                  {Array.from({ length: 8 }, (_, i) => (
                    <option key={i+1} value={i+1}>المستوى {i+1}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="تاريخ القبول" required error={errors.admission_date?.message}>
                <input {...register('admission_date')} type="date" className={cn('input', errors.admission_date && 'input-error')} />
              </Field>
              <Field label="نوع القبول">
                <select {...register('admission_type')} className="input">
                  <option value="regular">انتظام</option>
                  <option value="transfer">تحويل</option>
                  <option value="exceptional">استثنائي</option>
                </select>
              </Field>
            </div>
            <Field label="ملاحظات">
              <textarea {...register('notes')} rows={2} className="input resize-none" placeholder="أي ملاحظات إضافية..." />
            </Field>

            <div className="flex justify-between">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                ← السابق
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <UserPlus className="w-4 h-4" />
                إضافة الطالب
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Note */}
      <div className="card p-4 bg-amber-50 border-amber-200 text-sm text-amber-700">
        <p className="font-semibold mb-1">ملاحظة مهمة</p>
        <p className="text-xs leading-relaxed">
          إذا كان الطالب لم يسجّل بعد على المنصة، سيتم إنشاء ملفه الأكاديمي مبدئياً.
          يجب على الطالب التسجيل على <code className="bg-amber-100 px-1 rounded">/auth/signup</code> بنفس البريد الإلكتروني
          ليتمكن من الوصول.
        </p>
      </div>
    </div>
  );
}
