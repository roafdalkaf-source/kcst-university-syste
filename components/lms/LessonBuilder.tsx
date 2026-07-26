'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, GripVertical, Video, FileText, Link as LinkIcon, BookOpen, Loader2, Eye, EyeOff, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const schema = z.object({
  title:    z.string().min(2, 'مطلوب'),
  title_ar: z.string().optional(),
  type:     z.enum(['video','youtube','document','text']),
  video_url:  z.string().optional(),
  youtube_id: z.string().optional(),
  file_url:   z.string().optional(),
  content:    z.string().optional(),
  is_preview: z.boolean().default(false),
  video_duration_sec: z.number().int().min(0).default(0),
});
type F = z.infer<typeof schema>;

const TYPE_CONFIG = {
  video:    { icon: Video,    label: 'فيديو مرفوع',   color: 'text-blue-500 bg-blue-50' },
  youtube:  { icon: Video,    label: 'YouTube',         color: 'text-red-500 bg-red-50' },
  document: { icon: FileText, label: 'ملف PDF',         color: 'text-orange-500 bg-orange-50' },
  text:     { icon: BookOpen, label: 'محتوى نصي',      color: 'text-green-500 bg-green-50' },
} as const;

interface Props {
  sectionId: string;
  lessons:   any[];
  userId:    string;
}

export function LessonBuilder({ sectionId, lessons: initialLessons, userId }: Props) {
  const { i18n }  = useTranslation();
  const isRTL     = i18n.language === 'ar';
  const router    = useRouter();
  const sb        = createClient();
  const [lessons, setLessons]   = useState(initialLessons);
  const [modal, setModal]       = useState<{ open: boolean; edit?: any }>({ open: false });
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'youtube', is_preview: false, video_duration_sec: 0 },
  });
  const lessonType = watch('type');

  const openNew  = () => { reset({ type: 'youtube', is_preview: false, video_duration_sec: 0 }); setModal({ open: true }); };
  const openEdit = (l: any) => {
    reset({
      title: l.title, title_ar: l.title_ar ?? '', type: l.type,
      video_url: l.video_url ?? '', youtube_id: l.youtube_id ?? '',
      file_url: l.file_url ?? '', content: l.content ?? '',
      is_preview: l.is_preview, video_duration_sec: l.video_duration_sec ?? 0,
    });
    setModal({ open: true, edit: l });
  };

  const onSubmit = async (data: F) => {
    setSaving(true);
    const payload = {
      section_id:   sectionId,
      title:        data.title,
      title_ar:     data.title_ar || null,
      type:         data.type,
      video_url:    data.video_url || null,
      youtube_id:   data.youtube_id ? extractYoutubeId(data.youtube_id) : null,
      file_url:     data.file_url || null,
      content:      data.content || null,
      is_preview:   data.is_preview,
      video_duration_sec: data.video_duration_sec,
      order_index:  modal.edit ? modal.edit.order_index : lessons.length,
      created_by:   userId,
    };
    const { error } = modal.edit
      ? await sb.from('lms_lessons').update(payload).eq('id', modal.edit.id)
      : await sb.from('lms_lessons').insert(payload);
    setSaving(false);
    if (error) { toast.error('فشل الحفظ'); return; }
    toast.success(modal.edit ? 'تم التعديل' : 'تمت إضافة الدرس');
    setModal({ open: false });
    router.refresh();
  };

  const deleteLesson = async (id: string) => {
    setDeleting(id);
    const { error } = await sb.from('lms_lessons').delete().eq('id', id);
    setDeleting(null);
    if (error) { toast.error('فشل الحذف'); return; }
    toast.success('تم حذف الدرس');
    router.refresh();
  };

  const togglePublish = async (lesson: any) => {
    const { error } = await sb.from('lms_lessons')
      .update({ is_published: !lesson.is_published, published_at: lesson.is_published ? null : new Date().toISOString() })
      .eq('id', lesson.id);
    if (error) { toast.error('فشل التحديث'); return; }
    toast.success(lesson.is_published ? 'تم إخفاء الدرس' : 'تم نشر الدرس');
    router.refresh();
  };

  function extractYoutubeId(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
    return match ? match[1] : url;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">محتوى المقرر ({lessons.length} درس)</h3>
        <button onClick={openNew} className="btn-primary text-sm py-1.5">
          <Plus className="w-4 h-4"/> إضافة درس
        </button>
      </div>

      {/* Lessons list */}
      {lessons.length === 0 ? (
        <div className="card p-10 text-center border-dashed">
          <Video className="w-8 h-8 text-gray-200 mx-auto mb-2"/>
          <p className="text-sm text-gray-400">لا توجد دروس — ابدأ بإضافة درسك الأول</p>
          <button onClick={openNew} className="btn-primary mt-4 text-sm">
            <Plus className="w-4 h-4"/> إضافة درس
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.sort((a, b) => a.order_index - b.order_index).map((lesson, i) => {
            const cfg = TYPE_CONFIG[lesson.type as keyof typeof TYPE_CONFIG];
            const name = isRTL ? lesson.title_ar ?? lesson.title : lesson.title;
            const isOpen = expanded === lesson.id;
            return (
              <div key={lesson.id} className={cn('card overflow-hidden', lesson.is_published ? 'border-green-200' : 'border-gray-200')}>
                <div className="flex items-center gap-3 p-3">
                  <GripVertical className="w-4 h-4 text-gray-300 shrink-0 cursor-grab"/>
                  <span className="w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 flex items-center justify-center shrink-0">{i + 1}</span>
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', cfg.color)}>
                    <cfg.icon className="w-3.5 h-3.5"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{name}</p>
                    <p className="text-[10px] text-gray-400">{cfg.label}{lesson.video_duration_sec > 0 ? ` • ${Math.floor(lesson.video_duration_sec / 60)} دقيقة` : ''}{lesson.is_preview ? ' • معاينة مجانية' : ''}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => togglePublish(lesson)} title={lesson.is_published ? 'إخفاء' : 'نشر'}
                      className={cn('btn-ghost p-1.5', lesson.is_published ? 'text-green-600' : 'text-gray-400')}>
                      {lesson.is_published ? <Eye className="w-3.5 h-3.5"/> : <EyeOff className="w-3.5 h-3.5"/>}
                    </button>
                    <button onClick={() => openEdit(lesson)} className="btn-ghost p-1.5 text-gray-400 hover:text-blue-500">
                      <FileText className="w-3.5 h-3.5"/>
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : lesson.id)} className="btn-ghost p-1.5 text-gray-300">
                      {isOpen ? <ChevronDown className="w-3.5 h-3.5"/> : <ChevronRight className="w-3.5 h-3.5"/>}
                    </button>
                    <button onClick={() => deleteLesson(lesson.id)} disabled={deleting === lesson.id}
                      className="btn-ghost p-1.5 text-gray-300 hover:text-red-500">
                      {deleting === lesson.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                    </button>
                  </div>
                </div>
                {isOpen && (
                  <div className="border-t border-gray-100 p-3 bg-gray-50/50 animate-fade-in">
                    {lesson.youtube_id && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black mb-2">
                        <iframe src={`https://www.youtube.com/embed/${lesson.youtube_id}`} title={name}
                          allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"
                          allowFullScreen className="w-full h-full border-0"/>
                      </div>
                    )}
                    {lesson.content && (
                      <p className="text-sm text-gray-700 leading-relaxed">{lesson.content.slice(0, 300)}{lesson.content.length > 300 ? '...' : ''}</p>
                    )}
                    {lesson.file_url && (
                      <a href={lesson.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-500 hover:underline">
                        <FileText className="w-4 h-4"/> فتح الملف
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal.open && (
        <div className="modal-backdrop">
          <div className="modal-box p-6 max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">{modal.edit ? 'تعديل الدرس' : 'درس جديد'}</h2>
              <button onClick={() => setModal({ open: false })} className="btn-ghost p-1.5">✕</button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Type selector */}
              <div>
                <label className="label">نوع الدرس *</label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(TYPE_CONFIG) as Array<[string, typeof TYPE_CONFIG[keyof typeof TYPE_CONFIG]]>).map(([t, cfg]) => (
                    <label key={t} className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 cursor-pointer transition-all text-center',
                      lessonType === t ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200')}>
                      <input type="radio" {...register('type')} value={t} className="hidden"/>
                      <cfg.icon className={cn('w-4 h-4', cfg.color.split(' ')[0])}/>
                      <span className="text-[10px] font-medium text-gray-700">{cfg.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">العنوان (إنجليزي) *</label>
                  <input {...register('title')} placeholder="Lesson title" className={cn('input', errors.title && 'input-error')}/>
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="label">العنوان (عربي)</label>
                  <input {...register('title_ar')} placeholder="عنوان الدرس" className="input"/>
                </div>
              </div>

              {lessonType === 'youtube' && (
                <div>
                  <label className="label">رابط YouTube أو معرّف الفيديو *</label>
                  <input {...register('youtube_id')} placeholder="https://www.youtube.com/watch?v=... أو ID" className="input"/>
                  <p className="text-xs text-gray-400 mt-1">مثال: dQw4w9WgXcQ</p>
                </div>
              )}
              {lessonType === 'video' && (
                <div>
                  <label className="label">رابط الفيديو *</label>
                  <input {...register('video_url')} placeholder="https://..." className="input"/>
                </div>
              )}
              {lessonType === 'document' && (
                <div>
                  <label className="label">رابط الملف (PDF) *</label>
                  <input {...register('file_url')} placeholder="https://..." className="input"/>
                  <p className="text-xs text-gray-400 mt-1">ارفع الملف في Supabase Storage أولاً ثم انسخ الرابط</p>
                </div>
              )}
              {lessonType === 'text' && (
                <div>
                  <label className="label">محتوى الدرس</label>
                  <textarea {...register('content')} rows={5} placeholder="اكتب محتوى الدرس هنا..." className="input resize-none"/>
                </div>
              )}

              {(lessonType === 'video' || lessonType === 'youtube') && (
                <div>
                  <label className="label">مدة الفيديو (ثانية)</label>
                  <input {...register('video_duration_sec', { valueAsNumber: true })} type="number" min={0} className="input" placeholder="مثال: 600 = 10 دقائق"/>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" {...register('is_preview')} className="accent-primary-500 w-4 h-4"/>
                السماح بمعاينة مجانية (بدون تسجيل)
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal({ open: false })} className="btn-secondary flex-1">إلغاء</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving && <Loader2 className="w-4 h-4 animate-spin"/>}
                  {modal.edit ? 'حفظ التعديلات' : 'إضافة الدرس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
