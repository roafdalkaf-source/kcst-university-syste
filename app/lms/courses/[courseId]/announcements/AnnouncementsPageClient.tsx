'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Pin, Trash2, Loader2, Plus, Send } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader, EmptyState } from '@/components/shared';
import { fRelative, getInitials, cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Props {
  announcements: any[];
  courseId:      string;
  section:       any;
  userId:        string;
  isProfessor:   boolean;
}

export function AnnouncementsPageClient({ announcements, courseId, section, userId, isProfessor }: Props) {
  const { i18n } = useTranslation();
  const isRTL    = i18n.language === 'ar';
  const router   = useRouter();
  const sb       = createClient();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle]       = useState('');
  const [body, setBody]         = useState('');
  const [pinned, setPinned]     = useState(false);
  const [posting, setPosting]   = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const courseName = isRTL ? section.course?.name_ar : section.course?.name_en;

  const post = async () => {
    if (!title.trim() || !body.trim()) { toast.error('يرجى ملء العنوان والمحتوى'); return; }
    setPosting(true);
    const { error } = await sb.from('lms_announcements').insert({
      section_id: courseId, author_id: userId,
      title: title.trim(), body: body.trim(), is_pinned: pinned,
    });
    if (error) { toast.error('فشل النشر'); setPosting(false); return; }

    // Notify enrolled students
    const { data: enrs } = await sb
      .from('enrollments')
      .select('student:students(profile_id)')
      .eq('section_id', courseId).eq('status', 'enrolled');
    if (enrs?.length) {
      const notifs = (enrs as any[])
        .map(e => ({ user_id: e.student?.profile_id, type:'announcement',
          title_ar: title.trim(), title_en: title.trim(),
          body_ar: body.slice(0,100), body_en: body.slice(0,100),
          link: `/lms/courses/${courseId}` }))
        .filter(n => n.user_id);
      if (notifs.length) await sb.from('notifications').insert(notifs);
    }

    toast.success('تم نشر الإعلان');
    setTitle(''); setBody(''); setPinned(false); setShowForm(false);
    router.refresh();
    setPosting(false);
  };

  const del = async (id: string) => {
    setDeleting(id);
    await sb.from('lms_announcements').delete().eq('id', id);
    toast.success('تم حذف الإعلان');
    setDeleting(null);
    router.refresh();
  };

  const togglePin = async (ann: any) => {
    await sb.from('lms_announcements').update({ is_pinned: !ann.is_pinned }).eq('id', ann.id);
    router.refresh();
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="إعلانات المقرر"
        description={courseName}
        breadcrumbs={[
          { label: 'مقرراتي', href: '/lms/my-courses' },
          { label: courseName, href: `/lms/courses/${courseId}` },
          { label: 'الإعلانات' },
        ]}
        actions={isProfessor ? (
          <button onClick={() => setShowForm(s => !s)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> إعلان جديد
          </button>
        ) : undefined}
      />

      {/* Post form */}
      {showForm && isProfessor && (
        <div className="card p-5 space-y-3 animate-slide-up">
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="عنوان الإعلان *" className="input" />
          <textarea value={body} onChange={e => setBody(e.target.value)}
            rows={4} placeholder="محتوى الإعلان..." className="input resize-none" />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)}
              className="accent-primary-500 w-4 h-4" />
            تثبيت الإعلان في الأعلى
          </label>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">إلغاء</button>
            <button onClick={post} disabled={posting} className="btn-primary flex-1">
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              نشر وإشعار الطلاب
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {announcements.length === 0 ? (
        <EmptyState icon={Megaphone} title="لا توجد إعلانات"
          description={isProfessor ? 'انشر إعلانك الأول' : 'لم ينشر الأستاذ أي إعلانات بعد'} />
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id} className={cn('card p-5', ann.is_pinned && 'border-amber-200 bg-amber-50/30')}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-2.5">
                  {ann.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />}
                  <div>
                    <p className="text-sm font-bold text-gray-900">{ann.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                      <span>{isRTL ? ann.author?.full_name_ar ?? ann.author?.full_name : ann.author?.full_name}</span>
                      <span>•</span>
                      <span>{fRelative(ann.created_at, isRTL ? 'ar' : 'en')}</span>
                    </div>
                  </div>
                </div>
                {isProfessor && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => togglePin(ann)}
                      className={cn('p-1.5 rounded hover:bg-amber-100 transition-colors',
                        ann.is_pinned ? 'text-amber-500' : 'text-gray-300')}>
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(ann.id)} disabled={deleting === ann.id}
                      className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                      {deleting === ann.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ann.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
