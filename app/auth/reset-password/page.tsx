'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Loader2, CheckCircle2, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const schema = z.object({
  password: z.string().min(8, '8 أحرف على الأقل'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: 'كلمتا المرور غير متطابقتين', path: ['confirm'] });
type F = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const sb     = createClient();
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [done, setDone]     = useState(false);
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    const { error } = await sb.auth.updateUser({ password: data.password });
    if (error) { toast.error(error.message); return; }
    setDone(true);
    setTimeout(() => router.push('/auth/login'), 3000);
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600"/>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">تم تغيير كلمة المرور</h2>
        <p className="text-sm text-gray-500">يتم تحويلك لصفحة تسجيل الدخول...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary-500"/>
          </div>
          <p className="font-bold text-gray-800 text-sm">كلية كوش للعلوم والتكنولوجيا</p>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">تعيين كلمة مرور جديدة</h2>
        <p className="text-sm text-gray-500 mb-8">أدخل كلمة مرور قوية لا تقل عن 8 أحرف</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">كلمة المرور الجديدة</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="••••••••"
                className={cn('input ps-9 pe-10', errors.password && 'input-error')}/>
              <button type="button" onClick={() => setShowPw(v=>!v)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="label">تأكيد كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input {...register('confirm')} type="password" placeholder="••••••••"
                className={cn('input ps-9', errors.confirm && 'input-error')}/>
            </div>
            {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
            تعيين كلمة المرور
          </button>
        </form>
      </div>
    </div>
  );
}
