'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { GraduationCap, Loader2, User, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const schema = z.object({
  full_name: z.string().min(3,'الاسم يجب أن يكون 3 أحرف على الأقل'),
  email:     z.string().email('بريد غير صالح'),
  password:  z.string().min(8,'8 أحرف على الأقل'),
  confirm:   z.string(),
}).refine(d=>d.password===d.confirm,{message:'كلمتا المرور غير متطابقتين',path:['confirm']});
type F = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { register, handleSubmit, formState:{ errors, isSubmitting } } = useForm<F>({ resolver:zodResolver(schema) });
  const onSubmit = async (data: F) => {
    const sb = createClient();
    const { error } = await sb.auth.signUp({ email:data.email, password:data.password, options:{ data:{ full_name:data.full_name } } });
    if (error) { toast.error(error.message); return; }
    toast.success('تم إنشاء الحساب!');
    router.push('/join-request');
  };
  const fields = [
    { name:'full_name' as const, label:'الاسم الكامل', type:'text', icon:User, placeholder:'أحمد محمد علي' },
    { name:'email'     as const, label:'البريد الإلكتروني', type:'email', icon:Mail, placeholder:'you@example.com' },
    { name:'password'  as const, label:'كلمة المرور', type:'password', icon:Lock, placeholder:'••••••••' },
    { name:'confirm'   as const, label:'تأكيد كلمة المرور', type:'password', icon:Lock, placeholder:'••••••••' },
  ];
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-raised p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-primary-500"/></div>
          <p className="font-bold text-gray-800 text-sm">كلية كوش للعلوم والتكنولوجيا</p>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">إنشاء حساب</h2>
        <p className="text-sm text-gray-500 mb-8">أنشئ حسابك ثم أرسل طلب انضمام</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {fields.map(f=>(
            <div key={f.name}>
              <label className="label">{f.label}</label>
              <div className="relative">
                <f.icon className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input {...register(f.name)} type={f.type} placeholder={f.placeholder} className={cn('input ps-9',errors[f.name]&&'input-error')}/>
              </div>
              {errors[f.name] && <p className="text-xs text-red-500 mt-1">{errors[f.name]?.message}</p>}
            </div>
          ))}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-2.5">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
            إنشاء الحساب
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-5">
          لديك حساب؟ <Link href="/auth/login" className="text-primary-500 font-medium hover:underline">تسجيل الدخول</Link>
        </p>
      </div>
    </div>
  );
}
