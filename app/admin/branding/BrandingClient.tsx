'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Save, Loader2, GraduationCap, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/shared';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const schema = z.object({
  name_ar:       z.string().min(3, 'مطلوب'),
  name_en:       z.string().min(3, 'Required'),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون غير صالح'),
  accent_color:  z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'لون غير صالح'),
});
type F = z.infer<typeof schema>;

interface Props {
  initialBranding: any;
  adminId: string;
}

export function BrandingClient({ initialBranding, adminId }: Props) {
  const router = useRouter();
  const sb     = createClient();

  const [logoUrl, setLogoUrl]     = useState<string>(initialBranding.logo_url ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [preview, setPreview]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<F>({
    resolver: zodResolver(schema),
    defaultValues: {
      name_ar:       initialBranding.name_ar       ?? 'كلية كوش للعلوم والتكنولوجيا',
      name_en:       initialBranding.name_en       ?? 'Kush College for Science and Technology',
      primary_color: initialBranding.primary_color ?? '#1E3A5F',
      accent_color:  initialBranding.accent_color  ?? '#C9A84C',
    },
  });

  const values = watch();

  // Upload logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('الحجم الأقصى 2MB'); return; }
    setUploading(true);
    const path = `logo/${Date.now()}_${file.name}`;
    const { error } = await sb.storage.from('branding').upload(path, file, { upsert: true });
    if (error) { toast.error('فشل رفع الشعار'); setUploading(false); return; }
    const { data: { publicUrl } } = sb.storage.from('branding').getPublicUrl(path);
    setLogoUrl(publicUrl);
    setUploading(false);
    toast.success('تم رفع الشعار');
  };

  const onSubmit = async (data: F) => {
    setSaving(true);
    const { error } = await sb.from('app_settings').update({
      value: {
        name_ar:       data.name_ar,
        name_en:       data.name_en,
        logo_url:      logoUrl || null,
        primary_color: data.primary_color,
        accent_color:  data.accent_color,
      },
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    }).eq('key', 'branding');

    setSaving(false);
    if (error) { toast.error('فشل الحفظ'); return; }
    toast.success('تم حفظ الهوية البصرية');
    router.refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader
        title="الهوية البصرية"
        description="اسم الكلية، الشعار، والألوان"
        breadcrumbs={[{ label: 'الإدارة' }, { label: 'الهوية البصرية' }]}
        actions={
          <button onClick={() => setPreview(p => !p)} className="btn-secondary text-sm">
            <Eye className="w-4 h-4" />
            {preview ? 'إخفاء المعاينة' : 'معاينة'}
          </button>
        }
      />

      {/* Preview banner */}
      {preview && (
        <div
          className="rounded-2xl p-5 flex items-center gap-4 text-white"
          style={{ background: values.primary_color }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-contain bg-white/20 p-1" />
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: values.accent_color + '30' }}>
              <GraduationCap className="w-6 h-6" style={{ color: values.accent_color }} />
            </div>
          )}
          <div>
            <p className="font-bold text-lg leading-tight">{values.name_ar || 'اسم الكلية'}</p>
            <p className="text-xs opacity-60 mt-0.5">{values.name_en || 'College Name'}</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-white/30" style={{ background: values.accent_color }} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Logo */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">شعار الكلية</h3>
          <div className="flex items-center gap-5">
            {/* Preview */}
            <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <GraduationCap className="w-8 h-8 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-3">
                الصيغ المدعومة: PNG، SVG، JPG • الحجم الأقصى: 2MB
              </p>
              <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoUpload} className="hidden" />
              <div className="flex gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="btn-secondary text-sm">
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'جاري الرفع...' : 'رفع شعار'}
                </button>
                {logoUrl && (
                  <button type="button" onClick={() => setLogoUrl('')}
                    className="btn-ghost text-sm text-red-500 hover:bg-red-50">
                    <RefreshCw className="w-4 h-4" /> إزالة
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Names */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-800">اسم الكلية</h3>
          <div>
            <label className="label">الاسم العربي *</label>
            <input {...register('name_ar')} className={cn('input', errors.name_ar && 'input-error')}
              placeholder="كلية كوش للعلوم والتكنولوجيا" />
            {errors.name_ar && <p className="text-xs text-red-500 mt-1">{errors.name_ar.message}</p>}
          </div>
          <div>
            <label className="label">الاسم الإنجليزي *</label>
            <input {...register('name_en')} className={cn('input', errors.name_en && 'input-error')}
              placeholder="Kush College for Science and Technology" />
            {errors.name_en && <p className="text-xs text-red-500 mt-1">{errors.name_en.message}</p>}
          </div>
        </div>

        {/* Colors */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">الألوان</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">اللون الرئيسي</label>
              <div className="flex items-center gap-3">
                <input {...register('primary_color')} type="color"
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                <input {...register('primary_color')} type="text" placeholder="#1E3A5F"
                  className={cn('input flex-1 font-mono uppercase', errors.primary_color && 'input-error')} />
              </div>
              {errors.primary_color && <p className="text-xs text-red-500 mt-1">{errors.primary_color.message}</p>}
              <p className="text-xs text-gray-400 mt-1">الـ Sidebar والعناصر الرئيسية</p>
            </div>
            <div>
              <label className="label">اللون المميّز</label>
              <div className="flex items-center gap-3">
                <input {...register('accent_color')} type="color"
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                <input {...register('accent_color')} type="text" placeholder="#C9A84C"
                  className={cn('input flex-1 font-mono uppercase', errors.accent_color && 'input-error')} />
              </div>
              {errors.accent_color && <p className="text-xs text-red-500 mt-1">{errors.accent_color.message}</p>}
              <p className="text-xs text-gray-400 mt-1">الشارات والتمييزات</p>
            </div>
          </div>

          {/* Palette presets */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">ألوان مقترحة:</p>
            <div className="flex gap-2 flex-wrap">
              {[
                { primary: '#1E3A5F', accent: '#C9A84C', label: 'كلاسيك' },
                { primary: '#1B4332', accent: '#95D5B2', label: 'أخضر' },
                { primary: '#7B2D8B', accent: '#F0A500', label: 'بنفسجي' },
                { primary: '#1A1A2E', accent: '#E94560', label: 'داكن' },
                { primary: '#0D1B2A', accent: '#00B4D8', label: 'بحري' },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    // We use setValue via a different approach since we can't import it here
                    const primaryInput = document.querySelector('input[placeholder="#1E3A5F"]') as HTMLInputElement;
                    const accentInput  = document.querySelector('input[placeholder="#C9A84C"]') as HTMLInputElement;
                    if (primaryInput) { primaryInput.value = p.primary; primaryInput.dispatchEvent(new Event('input', { bubbles: true })); }
                    if (accentInput)  { accentInput.value  = p.accent;  accentInput.dispatchEvent(new Event('input', { bubbles: true })); }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs text-gray-600 transition-colors"
                >
                  <span className="flex gap-1">
                    <span className="w-3.5 h-3.5 rounded-full" style={{ background: p.primary }} />
                    <span className="w-3.5 h-3.5 rounded-full" style={{ background: p.accent }} />
                  </span>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full py-3">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'جاري الحفظ...' : 'حفظ الهوية البصرية'}
        </button>
      </form>
    </div>
  );
}
