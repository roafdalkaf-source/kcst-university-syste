'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { getDashboardUrl, cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const schema = z.object({
  email:    z.string().email('بريد إلكتروني غير صالح'),
  password: z.string().min(6, 'كلمة المرور قصيرة جداً'),
});
type F = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next   = params.get('next') || null;
  const [showPw, setShowPw] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<F>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: F) => {
    const sb = createClient();
    const { data: auth, error } = await sb.auth.signInWithPassword({ email:data.email, password:data.password });
    if (error) { toast.error('بريد أو كلمة مرور خاطئة'); return; }
    const { data: roles } = await sb.from('user_roles').select('role').eq('user_id', auth.user.id);
    const userRoles = (roles??[]).map(r=>r.role as UserRole);
    const dest = next ?? getDashboardUrl(userRoles);
    router.push(dest); router.refresh();
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    const sb = createClient();
    await sb.auth.signInWithOAuth({ provider:'google', options:{ redirectTo:`${window.location.origin}/auth/callback` } });
  };

  return (
    <div className="space-y-5">
      <button type="button" onClick={handleGoogle} disabled={googleLoading} className="btn-secondary w-full py-2.5 gap-3">
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin"/> :
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>}
        الدخول بحساب Google
      </button>
      <div className="relative flex items-center gap-3 text-xs text-gray-400">
        <div className="flex-1 h-px bg-gray-200"/>أو<div className="flex-1 h-px bg-gray-200"/>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label className="label">البريد الإلكتروني</label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input {...register('email')} type="email" autoComplete="email" placeholder="you@example.com" className={cn('input ps-9',errors.email&&'input-error')}/>
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0">كلمة المرور</label>
            <Link href="/auth/forgot-password" className="text-xs text-primary-500 hover:underline">نسيت كلمة المرور؟</Link>
          </div>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input {...register('password')} type={showPw?'text':'password'} autoComplete="current-password" placeholder="••••••••" className={cn('input ps-9 pe-10',errors.password&&'input-error')}/>
            <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
          تسجيل الدخول
        </button>
      </form>
      <p className="text-center text-sm text-gray-500">
        ليس لديك حساب؟{' '}
        <Link href="/auth/signup" className="text-primary-500 font-medium hover:underline">إنشاء حساب</Link>
      </p>
    </div>
  );
}
