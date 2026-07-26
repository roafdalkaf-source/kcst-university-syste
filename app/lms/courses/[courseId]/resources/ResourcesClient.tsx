'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Link as LinkIcon, BookOpen, ExternalLink, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const schema = z.object({
  title:       z.string().min(2, 'العنوان مطلوب'),
  description: z.string().optional(),
  type:        z.enum(['link','file','book','reference']),
  url:         z.string().url('رابط غير صالح').optional().or(z.literal('')),
});
type F = z.infer<typeof schema>;

const TYPE_CONFIG = {
  link:      { icon: LinkIcon,  label: 'رابط خارجي',  color: 'text-blue-500 bg-blue-50' },
  file:      { icon: FileText,  label: 'ملف',           color: 'text-orange-500 bg-orange-50' },
  book:      { icon: BookOpen,  label: 'كتاب',          color: 'text-green-500 bg-green-50' },
  reference: { icon: FileText,  label: 'مرجع',          color: 'text-purple-500 bg-purple-50' },
} as const;

interface Props {
  resources:   any[];
  courseId:    string;
  section:     any;
  userId:      string;
  isProfessor: boolean;
}

export function ResourcesClient({ resources, courseId, section, userId, isProfessor }: Props) {
  const { i18n } = useTranslation();
  const isRTL    = i18n.language === 'ar';
  const router   = useRouter();
  const sb       = createClient();

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string|null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'link' },
  });

  const type = watch('type');
  const courseName = isRTL ? section.course?.name_ar : section.course?.name_en;

  const onSubmit = async (data: F) => {
    setSaving(true);
    const { error } = await sb.from('lms_resources').insert({
      section_id:  courseId,
      title:       data.title,
      description: data.description || null,
      type:        data.type,
      url:         data.url || null,
      order_index: resources.length,
      created_by:  userId,
    });
    setSaving(false);
    if (error) { toast.error('فشل الإضافة'); return; }
    toast.success('تمت إضافة المصدر');
    reset(); setShowForm(false);
    router.refresh();
  };

  const del = async (id: string) => {
    setDeleting(id);
    await sb.from('lms_resources').delete().eq('id', id);
    toast.success('تم حذف المصدر');
    setDeleting(null);
    router.refresh();
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="مصادر المقرر"
        description={courseName}
        breadcrumbs={[
          { label: 'مقرراتي', href: '/lms/my-courses' },
          { label: courseName, href: `/lms/courses/${courseId}` },
          { label: 'المصادر' },
        ]}
        actions={isProfessor ? (
          <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> إضافة مصدر
          </button>
        ) : undefined}
      />

      {/* Add form */}
      {showForm && isProfessor && (
        <form onSubmit={handleSubmit(onSubmit)} className="card p-5 space-y-4 animate-slide-up">
          <h3 className="text-sm font-bold text-gray-800">مصدر جديد</h3>

          {/* Type */}
          <div>
            <label className="label">النوع</label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map(t => {
                const cfg = TYPE_CONFIG[t];
                return (
                  <label key={t} className={cn(
                    'flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-center',
                    type === t ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                  )}>
                    <input type="radio" {...register('type')} value={t} className="hidden" />
                    <cfg.icon className={cn('w-4 h-4', cfg.color.split(' ')[0])} />
                    <span className="text-[10px] font-medium text-gray-600">{cfg.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label">العنوان *</label>
            <input {...register('title')} placeholder="اسم المصدر..." className={cn('input', errors.title && 'input-error')} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>

          {(type === 'link' || type === 'book' || type === 'reference') && (
            <div>
              <label className="label">الرابط</label>
              <input {...register('url')} type="url" placeholder="https://..." className={cn('input', errors.url && 'input-error')} />
              {errors.url && <p className="text-xs text-red-500 mt-1">{errors.url.message}</p>}
            </div>
          )}

          <div>
            <label className="label">الوصف</label>
            <textarea {...register('description')} rows={2} className="input resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">إلغاء</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              إضافة المصدر
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {resources.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد مصادر"
          description={isProfessor ? 'أضف مصدرك الأول' : 'لم يضف الأستاذ مصادر بعد'} />
      ) : (
        <div className="space-y-2">
          {resources.map(res => {
            const cfg = TYPE_CONFIG[res.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.link;
            return (
              <div key={res.id} className="card p-4 flex items-start gap-3 hover:shadow-elevated transition-shadow group">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.color)}>
                  <cfg.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{res.title}</p>
                  {res.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{res.description}</p>}
                  <span className="text-[10px] text-gray-400 mt-0.5 block">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {res.url && (
                    <a href={res.url} target="_blank" rel="noopener noreferrer"
                      className="btn-ghost p-1.5 text-primary-500">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  {isProfessor && (
                    <button onClick={() => del(res.id)} disabled={deleting === res.id}
                      className="btn-ghost p-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      {deleting === res.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
