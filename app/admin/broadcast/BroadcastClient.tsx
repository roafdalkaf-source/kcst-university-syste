'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Megaphone, Loader2, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';

const schema = z.object({
  title_ar:  z.string().min(3, 'العنوان مطلوب'),
  title_en:  z.string().min(3, 'Title required'),
  body_ar:   z.string().optional(),
  body_en:   z.string().optional(),
  link:      z.string().optional(),
  target:    z.enum(['all','student','professor','teaching_assistant','registrar','finance_officer','dean','department_head']),
});
type F = z.infer<typeof schema>;

const ROLE_AR: Record<string,string> = {
  all:'جميع المستخدمين', student:'الطلاب', professor:'الأساتذة',
  teaching_assistant:'مساعدو التدريس', registrar:'المسجّلون',
  finance_officer:'موظفو المالية', dean:'العمداء', department_head:'رؤساء الأقسام',
};

interface Props {
  totalUsers: number;
  roleCounts: { role: string; count: number }[];
  adminId:    string;
}

export function BroadcastClient({ totalUsers, roleCounts, adminId }: Props) {
  const sb = createClient();
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState<{ count: number; title: string } | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { target: 'all' },
  });

  const target = watch('target');

  const getTargetCount = () => {
    if (target === 'all') return totalUsers;
    return roleCounts.find(r => r.role === target)?.count ?? 0;
  };

  const onSubmit = async (data: F) => {
    const count = getTargetCount();
    if (count === 0) { toast.error('لا يوجد مستخدمون في هذه الفئة'); return; }
    setSending(true);

    // Get user IDs for target role
    let profileIds: string[] = [];

    if (data.target === 'all') {
      const { data: profiles } = await sb.from('profiles').select('id').eq('is_active', true);
      profileIds = (profiles ?? []).map(p => p.id);
    } else {
      const { data: roles } = await sb.from('user_roles').select('user_id').eq('role', data.target);
      profileIds = (roles ?? []).map(r => r.user_id);
    }

    if (profileIds.length === 0) {
      toast.error('لم يُعثر على مستخدمين'); setSending(false); return;
    }

    // Batch insert notifications (50 at a time)
    const notifs = profileIds.map(uid => ({
      user_id:  uid,
      type:     'broadcast',
      title_ar: data.title_ar,
      title_en: data.title_en,
      body_ar:  data.body_ar || null,
      body_en:  data.body_en || null,
      link:     data.link || null,
    }));

    const batchSize = 50;
    let errors = 0;
    for (let i = 0; i < notifs.length; i += batchSize) {
      const { error } = await sb.from('notifications').insert(notifs.slice(i, i + batchSize));
      if (error) errors++;
    }

    setSending(false);
    if (errors > 0) {
      toast.error(`تم الإرسال مع ${errors} أخطاء`);
    } else {
      setSent({ count: profileIds.length, title: data.title_ar });
      toast.success(`تم إرسال الإشعار إلى ${profileIds.length} مستخدم`);
      reset();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader
        title="الإشعارات الجماعية"
        description="أرسل إشعاراً لمجموعة من المستخدمين دفعة واحدة"
        breadcrumbs={[{ label:'الإدارة' }, { label:'الإشعارات الجماعية' }]}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{totalUsers}</p>
          <p className="text-xs text-gray-400">إجمالي المستخدمين</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {roleCounts.find(r => r.role === 'student')?.count ?? 0}
          </p>
          <p className="text-xs text-gray-400">طلاب</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {roleCounts.find(r => r.role === 'professor')?.count ?? 0}
          </p>
          <p className="text-xs text-gray-400">أساتذة</p>
        </div>
      </div>

      {/* Success banner */}
      {sent && (
        <div className="card p-4 border-green-200 bg-green-50 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">تم الإرسال بنجاح!</p>
            <p className="text-xs text-green-600">
              "{sent.title}" — أُرسل إلى {sent.count} مستخدم
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <h3 className="text-sm font-bold text-gray-800">إعداد الإشعار</h3>

        {/* Target audience */}
        <div>
          <label className="label">الجمهور المستهدف *</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(ROLE_AR).map(([val, label]) => {
              const count = val === 'all' ? totalUsers : (roleCounts.find(r => r.role === val)?.count ?? 0);
              return (
                <label key={val} className={cn(
                  'flex items-center justify-between gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all',
                  target === val ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                )}>
                  <div className="flex items-center gap-2">
                    <input type="radio" value={val} {...register('target')} className="accent-primary-500" />
                    <span className="text-xs font-medium text-gray-700">{label}</span>
                  </div>
                  <span className={cn('text-[10px] font-bold', target === val ? 'text-primary-600' : 'text-gray-400')}>
                    {count}
                  </span>
                </label>
              );
            })}
          </div>

          {/* Target count indicator */}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            سيُرسل إلى <strong className="text-primary-600">{getTargetCount()}</strong> مستخدم
          </div>
        </div>

        {/* Titles */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">العنوان (عربي) *</label>
            <input {...register('title_ar')}
              placeholder="إعلان هام"
              className={cn('input', errors.title_ar && 'input-error')} />
            {errors.title_ar && <p className="text-xs text-red-500 mt-1">{errors.title_ar.message}</p>}
          </div>
          <div>
            <label className="label">العنوان (إنجليزي) *</label>
            <input {...register('title_en')}
              placeholder="Important Announcement"
              className={cn('input', errors.title_en && 'input-error')} />
            {errors.title_en && <p className="text-xs text-red-500 mt-1">{errors.title_en.message}</p>}
          </div>
        </div>

        {/* Bodies */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">التفاصيل (عربي)</label>
            <textarea {...register('body_ar')} rows={3}
              placeholder="اكتب تفاصيل الإشعار..."
              className="input resize-none" />
          </div>
          <div>
            <label className="label">التفاصيل (إنجليزي)</label>
            <textarea {...register('body_en')} rows={3}
              placeholder="Notification details..."
              className="input resize-none" />
          </div>
        </div>

        {/* Link */}
        <div>
          <label className="label">رابط (اختياري)</label>
          <input {...register('link')}
            placeholder="/academic/calendar"
            className="input" />
          <p className="text-xs text-gray-400 mt-1">رابط داخلي يُفتح عند النقر على الإشعار</p>
        </div>

        <button type="submit" disabled={sending || getTargetCount() === 0}
          className="btn-primary w-full py-3">
          {sending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</>
            : <><Megaphone className="w-4 h-4" /> إرسال إلى {getTargetCount()} مستخدم</>
          }
        </button>
      </form>
    </div>
  );
}
