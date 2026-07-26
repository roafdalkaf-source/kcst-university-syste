'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, CheckCircle, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const ROLES = [
  { value:'student',            label:'طالب',            desc:'للوصول لدرجاتي وجدولي وشهاداتي' },
  { value:'professor',          label:'أستاذ',           desc:'إدخال الدرجات وإدارة الشعب والمحتوى' },
  { value:'teaching_assistant', label:'مساعد تدريس',     desc:'دعم الأستاذ في إدارة المقرر' },
  { value:'registrar',          label:'مسجّل أكاديمي',  desc:'إدارة التسجيل والقبول' },
  { value:'finance_officer',    label:'موظف مالية',      desc:'إدارة الفواتير والمدفوعات' },
  { value:'department_head',    label:'رئيس قسم',        desc:'إدارة القسم والمقررات' },
  { value:'dean',               label:'عميد كلية',       desc:'الإشراف الكامل على الكلية' },
] as const;

const schema = z.object({
  requested_role: z.enum(['student','professor','teaching_assistant','registrar','finance_officer','department_head','dean']),
  student_id_no:  z.string().optional(),
  motivation:     z.string().min(10,'يرجى كتابة سبب مفصّل (10 أحرف على الأقل)').max(500),
});
type F = z.infer<typeof schema>;

export default function JoinRequestPage() {
  const router = useRouter();
  const sb     = createClient();
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch, formState:{ errors, isSubmitting } } = useForm<F>({
    resolver: zodResolver(schema), defaultValues:{ requested_role:'student' },
  });
  const role = watch('requested_role');

  const onSubmit = async (data: F) => {
    const { data:{ user } } = await sb.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }
    const { data:existing } = await sb.from('join_requests').select('id').eq('user_id',user.id).eq('status','pending').single();
    if (existing) { toast.error('لديك طلب معلق بالفعل'); return; }
    const { error } = await sb.from('join_requests').insert({ user_id:user.id, requested_role:data.requested_role, student_id_no:data.student_id_no||null, motivation:data.motivation });
    if (error) { toast.error('فشل إرسال الطلب'); return; }
    setDone(true);
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-green-600"/></div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال طلبك!</h2>
        <p className="text-sm text-gray-500 mb-6">ستتلقى إشعاراً بالقرار خلال 1-2 يوم عمل</p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400"><Clock className="w-4 h-4"/>في انتظار مراجعة الإدارة</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-primary-500"/></div>
          <div><p className="font-bold text-gray-800 text-sm">كلية كوش للعلوم والتكنولوجيا</p><p className="text-xs text-gray-400">طلب الانضمام للمنصة</p></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">طلب الانضمام</h1>
        <p className="text-sm text-gray-500 mb-6">حدد دورك وأرسل الطلب للإدارة</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label className="label">الدور المطلوب *</label>
            <div className="space-y-2">
              {ROLES.map(r=>(
                <label key={r.value} className={cn('flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all',role===r.value?'border-primary-500 bg-primary-50':'border-gray-100 hover:border-gray-200')}>
                  <input type="radio" value={r.value} {...register('requested_role')} className="accent-primary-500"/>
                  <div><p className="text-sm font-semibold text-gray-800">{r.label}</p><p className="text-xs text-gray-500">{r.desc}</p></div>
                </label>
              ))}
            </div>
          </div>
          {role==='student' && (
            <div>
              <label className="label">رقم الطالب <span className="text-gray-400">(إن كان لديك)</span></label>
              <input {...register('student_id_no')} placeholder="KCST-2025-0001" className="input font-mono"/>
            </div>
          )}
          <div>
            <label className="label">سبب الطلب *</label>
            <textarea {...register('motivation')} rows={4} placeholder="اشرح علاقتك بالكلية وسبب حاجتك لهذا الدور..." className={cn('input resize-none',errors.motivation&&'input-error')}/>
            {errors.motivation && <p className="text-xs text-red-500 mt-1">{errors.motivation.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
            إرسال الطلب
          </button>
        </form>
      </div>
    </div>
  );
}
