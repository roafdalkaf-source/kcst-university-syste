'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, GraduationCap, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const schema = z.object({ email: z.string().email('بريد غير صالح') });
type F = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const sb = createClient();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    await sb.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setSent(true);
  };

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised p-6">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600"/>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال الرابط</h2>
        <p className="text-sm text-gray-500 mb-6">تحقق من بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور.</p>
        <Link href="/auth/login" className="btn-primary w-full justify-center py-2.5">العودة لتسجيل الدخول</Link>
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
        <h2 className="text-2xl font-bold text-gray-900 mb-1">نسيت كلمة المرور؟</h2>
        <p className="text-sm text-gray-500 mb-8">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
              <input {...register('email')} type="email" placeholder="you@example.com"
                className={cn('input ps-9', errors.email && 'input-error')}/>
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
            إرسال رابط الاستعادة
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          <Link href="/auth/login" className="text-primary-500 font-medium hover:underline">العودة لتسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
